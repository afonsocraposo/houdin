import { initializeActions } from "../services/actionInitializer";
import { ActionRegistry } from "../services/actionRegistry";
import { ContentInjector } from "../services/injector";
import { NotificationService } from "../services/notification";
import { initializeTriggers } from "../services/triggerInitializer";
import { TriggerRegistry } from "../services/triggerRegistry";
import { ExecutionContext } from "../services/workflow";
import {
  ActionCommand,
  TriggerCommand,
  WorkflowCommand,
  WorkflowCommandType,
} from "../types/background-workflow";
import { TriggerExecutionContext } from "../types/triggers";

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
    // setupWorkflowScriptBridge();

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
        // Forward the message to the extension
        chrome.runtime
          .sendMessage({
            type: "workflow-script-response",
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
    chrome.runtime.onMessage.addListener(
      async (message, _sender, sendResponse) => {
        let context: ExecutionContext;
        switch (message.type) {
          case WorkflowCommandType.INIT_TRIGGER:
            const initTriggerCommand = message as TriggerCommand;
            const triggerRegistry = TriggerRegistry.getInstance();
            try {
              console.log("Initializing trigger:", initTriggerCommand.nodeType);
              triggerRegistry.setupTrigger(
                initTriggerCommand.nodeType,
                initTriggerCommand.nodeConfig,
                initTriggerCommand.context as TriggerExecutionContext,
                async (data?: any) => {
                  console.log(
                    "Trigger fired with data:",
                    data,
                    initTriggerCommand.nodeConfig,
                  );
                  sendResponse({
                    success: true,
                    data: data || initTriggerCommand.nodeConfig,
                  });
                },
              );
            } catch (error: any) {
              sendResponse({ success: false, error: error.message });
            }

            return;
          case WorkflowCommandType.EXECUTE_ACTION:
            const executeActionCommand = message as ActionCommand;
            const actionRegistry = ActionRegistry.getInstance();
            context = new ExecutionContext(executeActionCommand.context);
            try {
              actionRegistry.execute(
                executeActionCommand.nodeType,
                executeActionCommand.nodeConfig,
                context,
                executeActionCommand.nodeId,
                (data: any) =>
                  sendResponse({
                    success: true,
                    data,
                  }),
                (error: Error) =>
                  sendResponse({ success: false, error: error.message }),
              );
            } catch (error: any) {
              sendResponse({ success: false, error: error.message });
            }
            return;
        }
      },
    );
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContentScript);
  } else {
    initContentScript();
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    // if (contentInjector) {
    //   contentInjector.destroy();
    // }
    (window as any).changemeExtensionInitialized = false;
  });
}
