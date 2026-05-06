import { HttpListenerWebRequest } from "@/services/httpListenerWebRequest";
import { BackgroundWorkflowEngine } from "@/services/backgroundEngine";
import { WorkflowGenerationService } from "@/services/workflowGenerationService";
import {
  TriggerFiredCommand,
  WorkflowCommandType,
} from "@/types/background-workflow";
import { MessageType } from "@/types/messages";
import {
  type GenerationPromptRequest,
  type GenerationPromptResponse,
  type StopGenerationRequest,
} from "@/types/generation-session";
import { CustomMessage, sendMessageToContentScript } from "@/lib/messages";

import browser from "@/services/browser";
import { ApiClient } from "@/api/client";
import { WorkflowSyncer } from "@/services/workflowSyncer";

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

ApiClient.startBackgroundProxy();

const activeRuns = new Map<string, WorkflowGenerationService>();

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
        case MessageType.AI_GENERATION_SUBMIT:
          return (async () => {
            const request = message.data as GenerationPromptRequest;
            const service = new WorkflowGenerationService(request.workflowId);
            activeRuns.set(request.workflowId, service);

            try {
              return (await service.submitPrompt(
                request.prompt,
              )) as GenerationPromptResponse;
            } finally {
              if (activeRuns.get(request.workflowId) === service) {
                activeRuns.delete(request.workflowId);
              }
            }
          })();
        case MessageType.AI_GENERATION_STOP:
          return Promise.resolve(
            (() => {
              const request = message.data as StopGenerationRequest;
              const service = activeRuns.get(request.workflowId);
              if (!service) {
                return { stopped: false };
              }

              activeRuns.delete(request.workflowId);
              return service.stop();
            })(),
          );
        case WorkflowCommandType.TRIGGER_FIRED: {
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
        }
        case "REGISTER_HTTP_TRIGGER": {
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
        }

        case WorkflowCommandType.CLEAN_HTTP_TRIGGERS:
          if (httpListener) {
            httpListener.unregisterTriggers(sender.tab.id);
          }
          return;
      }
    },
  );
});
