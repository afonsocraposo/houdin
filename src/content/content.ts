import { initializeActions } from "../services/actionInitializer";
import { ActionRegistry } from "../services/actionRegistry";
import { ContentInjector } from "../services/injector";
import { NotificationService } from "../services/notification";
import { initializeTriggers } from "../services/triggerInitializer";
import { TriggerRegistry } from "../services/triggerRegistry";
import {
  ActionCommand,
  TriggerCommand,
  WorkflowCommandType,
} from "../types/background-workflow";

console.debug("Content script loaded");

// Prevent multiple initializations
if ((window as any).changemeExtensionInitialized) {
  console.debug("changeme extension already initialized, skipping");
} else {
  (window as any).changemeExtensionInitialized = true;

  let contentInjector: ContentInjector;

  const initContentScript = () => {
    console.debug("changeme extension content script initialized");

    // Initialize content injector
    contentInjector = new ContentInjector();
    contentInjector.initialize();

    // Set up bridge for workflow script responses
    setupWorkflowScriptBridge();

    // Set up notification message listener
    setupNotificationBridge();

    setupBackgroundEngineBridge();
  };

  const setupWorkflowScriptBridge = () => {
    // Listen for workflow script responses from the main world
    window.addEventListener("message", (event) => {
      if (
        event.source === window &&
        event.data.type === "workflow-script-response"
      ) {
        console.debug(
          "Content: Received workflow script response:",
          event.data,
        );
        // Forward the message to the extension
        chrome.runtime
          .sendMessage({
            type: "workflow-script-response",
            // TODO: add executionId
            nodeId: event.data.nodeId,
            result: event.data.result,
            error: event.data.error,
          })
          .catch((error) => {
            console.error("Failed to send workflow script response:", error);
          });
      }
    });
  };

  const setupNotificationBridge = () => {
    // Listen for notification messages from background script
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message.type === "SHOW_NOTIFICATION") {
        console.debug(
          "Content: Received notification message from background:",
          message.payload,
        );
        NotificationService.showNotification(message.payload);
      }
    });
  };

  const setupBackgroundEngineBridge = () => {
    initializeTriggers();
    initializeActions();
    // Listen for messages from the background workflow engine
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.type) {
        case WorkflowCommandType.INIT_TRIGGER:
          const initTriggerCommand = message as TriggerCommand;
          const start = Date.now();
          const triggerRegistry = TriggerRegistry.getInstance();
          triggerRegistry
            .setupTrigger(
              initTriggerCommand.nodeType,
              initTriggerCommand.nodeConfig,
              initTriggerCommand.workflowId,
              initTriggerCommand.nodeId,
              async (data?: any) => {
                console.debug(
                  "Content: Trigger fired:",
                  initTriggerCommand.nodeId,
                  "with data:",
                  data,
                );
                const duration = Date.now() - start;
                chrome.runtime
                  .sendMessage({
                    type: WorkflowCommandType.TRIGGER_FIRED,
                    url: window.location.href,
                    workflowId: initTriggerCommand.workflowId,
                    triggerNodeId: initTriggerCommand.nodeId,
                    data: data || initTriggerCommand.nodeConfig,
                    duration,
                  })
                  .catch((error) => {
                    console.error(
                      "Failed to send workflow script response:",
                      error,
                    );
                  });
              },
            )
            .catch((error: any) =>
              sendResponse({ success: false, error: error.message }),
            );
          return false;
        case WorkflowCommandType.EXECUTE_ACTION:
          const executeActionCommand = message as ActionCommand;
          const actionRegistry = ActionRegistry.getInstance();
          actionRegistry
            .execute(
              executeActionCommand.nodeType,
              executeActionCommand.nodeConfig,
              executeActionCommand.workflowId,
              executeActionCommand.nodeId,
            )
            .then((result) => sendResponse({ success: true, data: result }))
            .catch((error: any) =>
              sendResponse({ success: false, error: error.message }),
            );
          break;
        default:
          return false; // Ignore other messages
      }
      return true; // Indicate that we will respond asynchronously
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContentScript);
  } else {
    initContentScript();
  }

  const cleanUpHttpTriggers = () => {
    // Clean up any registered HTTP triggers
    chrome.runtime.sendMessage({
      type: WorkflowCommandType.CLEAN_HTTP_TRIGGERS,
    });
  };

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (contentInjector) {
      contentInjector.destroy();
    }
    cleanUpHttpTriggers();
    (window as any).changemeExtensionInitialized = false;
  });
}
