import { HttpListenerWebRequest } from "@/services/httpListenerWebRequest";
import { BackgroundWorkflowEngine } from "@/services/backgroundEngine";
import {
  TriggerFiredCommand,
  WorkflowCommandType,
} from "@/types/background-workflow";
import { StorageServer } from "@/services/storage";
import { CustomMessage, sendMessageToContentScript } from "@/lib/messages";

import browser from "@/services/browser";
import { WorkflowSyncer } from "@/services/workflowSyncer";
import { useStore } from "@/store";
import type { Runtime } from "webextension-polyfill";
import { StorageMigration } from "@/services/storageMigration";

let httpListener: HttpListenerWebRequest | null = null;
if (browser.webRequest.onBeforeRequest) {
  try {
    httpListener = HttpListenerWebRequest.getInstance();
    console.debug(
      "Background: HttpListenerWebRequest initialized successfully with direct chrome API",
    );
  } catch (error) {
    console.error(
      "Background: Failed to initialize HttpListenerWebRequest:",
      error,
    );
  }
} else {
  console.error("Background: webRequest.onBeforeRequest not available");
}

browser.runtime.onInstalled.addListener(() => {
  console.debug("Extension installed");
});

if (browser.action) {
  browser.action.onClicked.addListener((_tab: any) => {});
}

browser.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
  if (changeInfo.url) {
    const url = changeInfo.url;
    if (url.startsWith("https://houdin.config")) {
      const configUrl = browser.runtime.getURL("src/config/index.html");
      browser.tabs.update(tabId, { url: configUrl });
    }
  }
});

if (browser.webNavigation) {
  browser.webNavigation.onBeforeNavigate.addListener((details: any) => {
    const url = details.url;
    if (url.startsWith("https://houdin.config")) {
      const configUrl = browser.runtime.getURL("src/config/index.html");
      browser.tabs.update(details.tabId, { url: configUrl });
    }
  });
}

StorageServer.getInstance();

StorageMigration.runMigrations().catch((error) => {
  console.error("Storage migration failed:", error);
});

const workflowSyncer = WorkflowSyncer.getInstance();
workflowSyncer.sync(true);
workflowSyncer.init();

const connectedPorts = new Set<Runtime.Port>();

browser.runtime.onConnect.addListener((port) => {
  if (port.name === "store-sync") {
    connectedPorts.add(port);
    console.debug("Background: Store sync port connected");

    port.onDisconnect.addListener(() => {
      connectedPorts.delete(port);
      console.debug("Background: Store sync port disconnected");
    });
  }
});

useStore.subscribe((state) => {
  connectedPorts.forEach((port) => {
    try {
      port.postMessage({
        type: "STORE_STATE_UPDATE",
        state,
      });
    } catch (error) {
      console.error("Background: Error sending state update to port:", error);
      connectedPorts.delete(port);
    }
  });
});

const workflowEngine = new BackgroundWorkflowEngine();
workflowEngine.initialize().then(() => {
  browser.webNavigation.onCompleted.addListener(
    (details: { url: string; tabId: number; frameId: number }) => {
      if (details.frameId === 0) {
        workflowEngine.onNewUrl(details.tabId, details.url);
      }
    },
    { url: [{ schemes: ["http", "https"] }] },
  );

  browser.runtime.onMessage.addListener(
    (message: CustomMessage, sender: any) => {
      switch (message.type) {
        case WorkflowCommandType.TRIGGER_FIRED:
          const tabId = sender.tab.id;

          const response = message.data as TriggerFiredCommand;
          const url = response.url;
          const workflowId = response.workflowId;
          const triggerNodeId = response.triggerNodeId;
          const triggerData = response.data || {};
          const config = response.config || {};
          const duration = response.duration || 0;
          workflowEngine.dispatchExecutor({
            url,
            tabId,
            workflowId,
            triggerNodeId,
            triggerData,
            config,
            duration,
          });
          return;
        case "REGISTER_HTTP_TRIGGER":
          console.debug("Background: Registering HTTP trigger", message);

          if (!httpListener) {
            console.error(
              "Background: Cannot register HTTP trigger - httpListener not available",
            );
            return;
          }

          const triggerCallback = async (data: any) => {
            console.debug("HTTP trigger fired:", {
              tabId: sender.tab.id,
              workflowId: message.data.workflowId,
              triggerNodeId: message.data.triggerNodeId,
              data,
            });
            sendMessageToContentScript(sender.tab.id, "HTTP_TRIGGER_FIRED", {
              workflowId: message.data.workflowId,
              triggerNodeId: message.data.triggerNodeId,
              data,
            }).catch(() => {});
          };

          httpListener.registerTrigger(
            sender.tab.id,
            message.data.workflowId,
            message.data.triggerNodeId,
            message.data.urlPattern,
            message.data.method,
            triggerCallback,
          );
          return;

        case WorkflowCommandType.CLEAN_HTTP_TRIGGERS:
          if (httpListener) {
            httpListener.unregisterTriggers(sender.tab.id);
          }
          return;
      }
    },
  );
});
