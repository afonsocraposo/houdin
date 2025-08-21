import { HttpListenerWebRequest } from "../services/httpListenerWebRequest";
import { BackgroundWorkflowEngine } from "../services/backgroundEngine";
import { WorkflowCommandType } from "../types/background-workflow";
import { StorageServer } from "../services/storage";

const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

let httpListener: HttpListenerWebRequest | null = null;
if (runtime?.webRequest?.onBeforeRequest) {
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
  console.error("Background: chrome.webRequest.onBeforeRequest not available");
}

runtime.runtime.onInstalled.addListener(() => {
  console.debug("Extension installed");
});

if (runtime.action) {
  runtime.action.onClicked.addListener((_tab: any) => {
    // Extension icon clicked
  });
}

// Handle navigation to changeme.config
runtime.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
  if (changeInfo.url && changeInfo.url.includes("changeme.config")) {
    // Redirect to the config page
    const configUrl = runtime.runtime.getURL("src/config/index.html");
    runtime.tabs.update(tabId, { url: configUrl });
  }
});

// Note: webNavigation API requires additional permission in manifest v3
if (runtime.webNavigation) {
  runtime.webNavigation.onBeforeNavigate.addListener((details: any) => {
    if (details.url.includes("changeme.config")) {
      const configUrl = runtime.runtime.getURL("src/config/index.html");
      runtime.tabs.update(details.tabId, { url: configUrl });
    }
  });
}

const storageServer = StorageServer.getInstance();
storageServer.init();

const workflowEngine = new BackgroundWorkflowEngine(storageServer);
workflowEngine.initialize().then(() => {
  runtime.webNavigation.onCompleted.addListener(
    (details: { url: string; tabId: number; frameId: number }) => {
      if (details.frameId === 0) {
        workflowEngine.onNewUrl(details.tabId, details.url);
      }
    },
    { url: [{ schemes: ["http", "https"] }] },
  );

  runtime.runtime.onMessage.addListener(
    (message: any, sender: any, _sundResponse: (response: any) => void) => {
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
            workflowId: message.workflowId,
            triggerNodeId: message.triggerNodeId,
            data,
          });
          // Send trigger event back to content script
          runtime.tabs
            .sendMessage(sender.tab.id, {
              type: "HTTP_TRIGGER_FIRED",
              workflowId: message.workflowId,
              triggerNodeId: message.triggerNodeId,
              data,
            })
            .catch(() => {
              // send and forget
            });
        };

        httpListener.registerTrigger(
          sender.tab.id,
          message.workflowId,
          message.triggerNodeId,
          message.urlPattern,
          message.method,
          triggerCallback,
        );
        return false;
      } else if (message.type === WorkflowCommandType.CLEAN_HTTP_TRIGGERS) {
        // Unregister HTTP triggers
        if (httpListener) {
          httpListener.unregisterTriggers(sender.tab.id);
        }
        return false;
      } else if (message.type === WorkflowCommandType.TRIGGER_FIRED) {
        const tabId = sender.tab.id;
        const url = message.url;
        const workflowId = message.workflowId;
        const triggerNodeId = message.triggerNodeId;
        const data = message.data || {};
        const duration = message.duration || undefined;
        workflowEngine.dispatchExecutor(
          url,
          tabId,
          workflowId,
          triggerNodeId,
          data,
          duration,
        );
        return false;
      }
    },
  );
});
