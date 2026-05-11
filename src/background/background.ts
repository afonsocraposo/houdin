import { HttpListenerWebRequest } from "@/services/httpListenerWebRequest";
import { BackgroundWorkflowEngine } from "@/services/backgroundEngine";
import {
  TriggerFiredCommand,
  WorkflowCommandType,
} from "@/types/background-workflow";
import { CustomMessage, sendMessageToContentScript } from "@/lib/messages";

import browser from "@/services/browser";
import { ApiClient } from "@/api/client";
import { WorkflowSyncer } from "@/services/workflowSyncer";
import { ChatbotService } from "../services/chatbot";

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

const workflowSyncer = WorkflowSyncer.getInstance();
workflowSyncer.sync(true);
workflowSyncer.init();

const chatbot = ChatbotService.getInstance();
chatbot.init();

ApiClient.startBackgroundProxy();

const workflowEngine = new BackgroundWorkflowEngine();

browser.tabs.onRemoved.addListener((tabId: number) => {
  workflowEngine.clearTab(tabId);
  if (httpListener) {
    httpListener.unregisterTriggers(tabId);
  }
});

browser.runtime.onMessage.addListener(
  (
    message: CustomMessage,
    sender: any,
    sendResponse: (response?: any) => void,
  ) => {
    switch (message.type) {
      case WorkflowCommandType.TRIGGER_FIRED: {
        const tabId = sender.tab.id;

        const response = message.data as TriggerFiredCommand;
        const url = response.url;
        const pageTitle = sender.tab?.title || "";
        const workflowId = response.workflowId;
        const triggerNodeId = response.triggerNodeId;
        const triggerData = response.data || {};
        const config = response.config || {};
        const duration = response.duration || 0;
        workflowEngine.dispatchExecutor({
          url,
          pageTitle,
          tabId,
          workflowId,
          triggerNodeId,
          triggerData,
          config,
          duration,
        });
        return;
      }
      case "REGISTER_HTTP_TRIGGER": {
        console.debug("Background: Registering HTTP trigger", message);

        if (!httpListener) {
          console.error(
            "Background: Cannot register HTTP trigger - httpListener not available",
          );
          sendResponse({ success: false, error: "httpListener not available" });
          return true;
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
        sendResponse({ success: true });
        return true;
      }

      case "UNREGISTER_HTTP_TRIGGER": {
        if (httpListener) {
          httpListener.unregisterTrigger(
            sender.tab.id,
            message.data.workflowId,
            message.data.triggerNodeId,
          );
        }
        return;
      }

      case WorkflowCommandType.CLEAN_HTTP_TRIGGERS:
        if (httpListener) {
          httpListener.unregisterTriggers(sender.tab.id);
        }
        return;
    }
  },
);

workflowEngine.initialize().then(() => {
  browser.webNavigation.onCommitted.addListener(
    (details: {
      tabId: number;
      frameId: number;
      transitionType?: string;
      transitionQualifiers?: string[];
    }) => {
      if (details.frameId !== 0) return;

      // Only clear tab state for cross-document navigations (typed URL,
      // link click, reload, etc.).  SPA-style back/forward navigations
      // keep the content script alive, so clearing state would kill
      // in-flight executors.  Those navigations are handled by
      // onHistoryStateUpdated → onNewUrl which does its own
      // delta-based cleanup.
      const isBackForward =
        details.transitionQualifiers?.includes("forward_back");

      if (!isBackForward) {
        workflowEngine.clearTab(details.tabId);
        if (httpListener) {
          httpListener.unregisterTriggers(details.tabId);
        }
      }
    },
    { url: [{ schemes: ["http", "https"] }] },
  );

  browser.webNavigation.onCompleted.addListener(
    (details: { url: string; tabId: number; frameId: number }) => {
      if (details.frameId === 0) {
        workflowEngine.onNewUrl(details.tabId, details.url).catch((error) => {
          console.warn("Failed to handle completed navigation:", error);
        });
      }
    },
    { url: [{ schemes: ["http", "https"] }] },
  );

  browser.webNavigation.onHistoryStateUpdated.addListener(
    (details: { url: string; tabId: number; frameId: number }) => {
      if (details.frameId === 0) {
        workflowEngine.onNewUrl(details.tabId, details.url).catch((error) => {
          console.warn("Failed to handle history state update:", error);
        });
      }
    },
    { url: [{ schemes: ["http", "https"] }] },
  );
});
