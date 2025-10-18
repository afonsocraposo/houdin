import { HttpListenerWebRequest } from "@/services/httpListenerWebRequest";
import { BackgroundWorkflowEngine } from "@/services/backgroundEngine";
import {
  TriggerFiredCommand,
  WorkflowCommandType,
} from "@/types/background-workflow";
import { StorageServer } from "@/services/storage";
import { CustomMessage, sendMessageToContentScript } from "@/lib/messages";

import browser from "@/services/browser";

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
  browser.action.onClicked.addListener((_tab: any) => {
    // Extension icon clicked
  });
}

// Handle navigation to houdin.config
browser.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
  if (changeInfo.url && changeInfo.url.includes("houdin.config")) {
    // Redirect to the config page
    const configUrl = browser.runtime.getURL("src/config/index.html");
    browser.tabs.update(tabId, { url: configUrl });
  }
});

// Note: webNavigation API requires additional permission in manifest v3
if (browser.webNavigation) {
  browser.webNavigation.onBeforeNavigate.addListener((details: any) => {
    if (details.url.includes("houdin.config")) {
      const configUrl = browser.runtime.getURL("src/config/index.html");
      browser.tabs.update(details.tabId, { url: configUrl });
    }
  });
}

// Initialize storage server
// @ts-ignore
const storageServer = StorageServer.getInstance();

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
    (
      message: CustomMessage,
      sender: any,
      _sendResponse: (response: any) => void,
    ) => {
      if (message.type === "REGISTER_HTTP_TRIGGER") {
        // Register HTTP trigger with webRequest API
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
          // Send trigger event back to content script
          sendMessageToContentScript(sender.tab.id, "HTTP_TRIGGER_FIRED", {
            workflowId: message.data.workflowId,
            triggerNodeId: message.data.triggerNodeId,
            data,
          }).catch(() => {
            // send and forget
          });
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
      } else if (message.type === WorkflowCommandType.CLEAN_HTTP_TRIGGERS) {
        // Unregister HTTP triggers
        if (httpListener) {
          httpListener.unregisterTriggers(sender.tab.id);
        }
        return;
      } else if (message.type === WorkflowCommandType.TRIGGER_FIRED) {
        const tabId = sender.tab.id;

        const response = message.data as TriggerFiredCommand;
        const url = response.url;
        const workflowId = response.workflowId;
        const triggerNodeId = response.triggerNodeId;
        const data = response.data || {};
        const duration = response.duration || 0;
        workflowEngine.dispatchExecutor(
          url,
          tabId,
          workflowId,
          triggerNodeId,
          data,
          duration,
        );
        return;
      }
    },
  );
});
