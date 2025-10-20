import { CustomMessage, sendMessageToBackground } from "@/lib/messages";
import { initializeActions } from "@/services/actionInitializer";
import { ActionRegistry } from "@/services/actionRegistry";
import { initializeCredentials } from "@/services/credentialInitializer";
import { ContentInjector } from "@/services/injector";
import {
  NotificationProps,
  NotificationService,
} from "@/services/notification";
import { initializeTriggers } from "@/services/triggerInitializer";
import { TriggerRegistry } from "@/services/triggerRegistry";
import { WorkflowScriptMessage } from "@/services/userScriptManager";
import {
  ActionCommand,
  ReadinessResponse,
  StatusMessage,
  TriggerCommand,
  TriggerFiredCommand,
  WorkflowCommand,
  WorkflowCommandType,
} from "@/types/background-workflow";
import browser from "@/services/browser";

console.debug("Content script loaded");

// Prevent multiple initializations
if ((window as any).houdinExtensionInitialized) {
  console.debug("Houdin extension already initialized, skipping");
} else {
  (window as any).houdinExtensionInitialized = true;

  let contentInjector: ContentInjector;
  let isFullyInitialized = false;
  let isInitializing = false;

  const initMinimalContentScript = () => {
    console.debug("Houdin extension minimal initialization");

    // Set up readiness check listener
    setupReadinessCheckListener();
  };

  const initFullContentScript = () => {
    if (isFullyInitialized || isInitializing) return;
    isInitializing = true;

    console.debug("Houdin extension full initialization");

    // Initialize content injector
    contentInjector = new ContentInjector();
    contentInjector.initialize();

    // Set up notification message listener
    setupNotificationBridge();

    // Set up workflow script bridge (only needed when workflows are active)
    setupWorkflowScriptBridge();

    // Set up workflow engine bridge
    setupBackgroundEngineBridge();

    isFullyInitialized = true;
    isInitializing = false;
  };

  const setupReadinessCheckListener = () => {
    browser.runtime.onMessage.addListener(
      (
        message: CustomMessage<any>,
        _sender,
        sendResponse: (response: ReadinessResponse) => void,
      ) => {
        if (message.type === WorkflowCommandType.CHECK_READINESS) {
          console.debug("Content: Received readiness check");

          if (!isFullyInitialized) {
            initFullContentScript();
          }

          sendResponse({ ready: true });
          return true; // Indicate async response
        }
        return; // Let other listeners handle other messages
      },
    );
  };

  const setupWorkflowScriptBridge = () => {
    // Listen for workflow script responses from the main world
    window.addEventListener(
      "message",
      (event: MessageEvent<WorkflowScriptMessage>) => {
        if (
          event.source === window &&
          event.data.type === "workflow-script-response"
        ) {
          console.debug(
            "Content: Received workflow script response:",
            event.data,
          );
          // Forward the message to the extension
          sendMessageToBackground<WorkflowScriptMessage>(
            "workflow-script-response",
            {
              type: "workflow-script-response",
              // TODO: add executionId
              nodeId: event.data.nodeId,
              result: event.data.result,
              error: event.data.error,
            },
          ).catch((error) => {
            console.error("Failed to send workflow script response:", error);
          });
        }
      },
    );
  };

  const setupNotificationBridge = () => {
    // Listen for notification messages from background script
    browser.runtime.onMessage.addListener(
      (message: CustomMessage<NotificationProps>, _sender, _sendResponse) => {
        if (message.type === "SHOW_NOTIFICATION") {
          console.debug(
            "Content: Received notification message from background:",
            message.data,
          );
          NotificationService.showNotification(message.data);
        }
      },
    );
  };

  const setupBackgroundEngineBridge = () => {
    initializeTriggers();
    initializeActions();
    initializeCredentials();
    // Listen for messages from the background workflow engine
    browser.runtime.onMessage.addListener(
      (
        message: CustomMessage<WorkflowCommand>,
        _sender,
        sendResponse: (response: StatusMessage) => void,
      ) => {
        switch (message.type) {
          case WorkflowCommandType.INIT_TRIGGER:
            const initTriggerCommand = message.data as TriggerCommand;
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

                  const response: TriggerFiredCommand = {
                    type: WorkflowCommandType.TRIGGER_FIRED,
                    url: window.location.href,
                    workflowId: initTriggerCommand.workflowId,
                    triggerNodeId: initTriggerCommand.nodeId,
                    data: data || initTriggerCommand.nodeConfig,
                    duration,
                  };

                  sendMessageToBackground<TriggerFiredCommand>(
                    WorkflowCommandType.TRIGGER_FIRED,
                    response,
                  ).catch((error) => {
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
            return; // Indicate async response
          case WorkflowCommandType.EXECUTE_ACTION:
            const executeActionCommand = message.data as ActionCommand;
            const actionRegistry = ActionRegistry.getInstance();
            actionRegistry
              .execute(
                executeActionCommand.nodeType,
                executeActionCommand.nodeConfig,
                executeActionCommand.workflowId,
                executeActionCommand.nodeId,
              )
              .then((result) => sendResponse({ success: true, data: result }))
              .catch((error: any) => {
                NotificationService.showErrorNotification({
                  title: `Error executing ${executeActionCommand.nodeId}`,
                  message: error.message,
                });
                sendResponse({ success: false, error: error.message });
              });
            break;
          default:
            return; // Ignore other messages
        }
        return true;
      },
    );
  };

  // Initialize minimal content script when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMinimalContentScript);
  } else {
    initMinimalContentScript();
  }

  const cleanUpHttpTriggers = () => {
    sendMessageToBackground(WorkflowCommandType.CLEAN_HTTP_TRIGGERS);
  };

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (contentInjector) {
      contentInjector.destroy();
    }
    cleanUpHttpTriggers();
    (window as any).houdinExtensionInitialized = false;
  });
}
