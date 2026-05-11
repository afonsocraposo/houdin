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
  CleanupWorkflowTriggersCommand,
  ReadinessResponse,
  StatusMessage,
  TriggerCommand,
  TriggerFiredCommand,
  WorkflowCommand,
  WorkflowCommandType,
} from "@/types/background-workflow";
import browser from "@/services/browser";
import {
  PageContextSnapshot,
  SelectedElementContext,
  VisibleElementContext,
} from "@/types/generation-session";

console.debug("Content script loaded");

// Prevent multiple initializations
if ((window as any).houdinExtensionInitialized) {
  console.debug("Houdin extension already initialized, skipping");
} else {
  (window as any).houdinExtensionInitialized = true;

  let contentInjector: ContentInjector;
  let isFullyInitialized = false;
  let isInitializing = false;
  let lastSelectedElement: SelectedElementContext | undefined;

  interface ElementSelectedDetail {
    selector: string;
    source?: "inspector" | "ai-chat" | "workflow-action";
    silent?: boolean;
    element: {
      tagName: string;
      className: string;
      id: string;
      textContent: string | null;
    };
  }

  const initMinimalContentScript = () => {
    console.debug("Houdin extension minimal initialization");

    // Set up readiness check listener
    setupReadinessCheckListener();
    setupElementSelectionBridge();
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
        if (message.type === "GET_PAGE_CONTEXT") {
          sendResponse({ ready: true, data: getPageContextSnapshot() });
          return true;
        }

        if (message.type === WorkflowCommandType.CHECK_READINESS) {
          console.log(isFullyInitialized);
          if (isFullyInitialized) {
            contentInjector?.ensureInitialized();
          } else {
            initFullContentScript();
          }

          sendResponse({ ready: true });
          return true; // Indicate async response
        }
        return; // Let other listeners handle other messages
      },
    );
  };

  const isElementVisible = (element: Element): boolean => {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return false;
    }

    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  };

  const getElementSelector = (element: Element): string => {
    if (element.id) {
      return `#${element.id}`;
    }

    const classes = Array.from(element.classList || []).filter(Boolean);
    if (classes.length > 0) {
      return `${element.tagName.toLowerCase()}.${classes.join(".")}`;
    }

    return element.tagName.toLowerCase();
  };

  const getElementText = (element: HTMLElement): string | undefined => {
    const text = element.textContent?.trim();
    if (!text) {
      return undefined;
    }

    return text.slice(0, 50);
  };

  const getSelectedElementContext = (): SelectedElementContext | undefined => {
    if (lastSelectedElement) {
      return lastSelectedElement;
    }

    const selection = window.getSelection();
    const selectionNode = selection?.anchorNode;
    const selectionElement =
      selectionNode instanceof Element
        ? selectionNode
        : selectionNode?.parentElement;

    if (selectionElement instanceof HTMLElement) {
      return {
        selector: getElementSelector(selectionElement),
        tagName: selectionElement.tagName.toLowerCase(),
        text: getElementText(selectionElement),
        ariaLabel: selectionElement.getAttribute("aria-label") || undefined,
        id: selectionElement.id || undefined,
        className: selectionElement.className?.toString() || undefined,
      };
    }

    const active = document.activeElement as HTMLElement | null;
    if (
      !active ||
      active === document.body ||
      active === document.documentElement
    ) {
      return undefined;
    }

    return {
      selector: getElementSelector(active),
      tagName: active.tagName.toLowerCase(),
      text: getElementText(active),
      ariaLabel: active.getAttribute("aria-label") || undefined,
      id: active.id || undefined,
      className: active.className?.toString() || undefined,
    };
  };

  const getVisibleElements = (): VisibleElementContext[] => {
    const selectors = [
      "header *",
      "main *",
      "button",
      "a",
      "input",
      "textarea",
      "select",
      "[role='button']",
      "[role='dialog']",
      "[aria-label]",
    ].join(", ");

    const elements = Array.from(document.querySelectorAll(selectors))
      .filter((element) => isElementVisible(element))
      .slice(0, 24);

    return elements.map((element) => {
      const htmlElement = element as HTMLElement;
      return {
        selector: getElementSelector(htmlElement),
        tagName: htmlElement.tagName.toLowerCase(),
        text: htmlElement.textContent?.trim().slice(0, 120) || undefined,
        ariaLabel: htmlElement.getAttribute("aria-label") || undefined,
        role: htmlElement.getAttribute("role") || undefined,
      };
    });
  };

  const getPageContextSnapshot = (): PageContextSnapshot => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || undefined;

    return {
      url: window.location.href,
      title: document.title,
      selectedText,
      selectedElement: getSelectedElementContext(),
      visibleElements: getVisibleElements(),
    };
  };

  const setupElementSelectionBridge = () => {
    window.addEventListener("houdinElementSelected", (event: Event) => {
      const customEvent = event as CustomEvent<{
        type: string;
        data: ElementSelectedDetail;
      }>;

      if (customEvent.detail?.type !== "elementSelected") {
        return;
      }

      const selected = customEvent.detail.data;
      lastSelectedElement = {
        selector: selected.selector,
        tagName: selected.element.tagName.toLowerCase(),
        text: selected.element.textContent?.trim().slice(0, 50) || undefined,
        id: selected.element.id || undefined,
        className: selected.element.className || undefined,
      };
    });
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
          case WorkflowCommandType.CLEANUP_TRIGGERS: {
            const triggerRegistry = TriggerRegistry.getInstance();
            triggerRegistry
              .cleanupAll()
              .then(() => {
                sendResponse({ success: true });
              })
              .catch((error) => {
                console.error("Failed to cleanup triggers:", error);
                sendResponse({ success: false, error: String(error) });
              });
            return true; // async response
          }
          case WorkflowCommandType.CLEANUP_WORKFLOW_TRIGGERS: {
            const cleanupCommand =
              message.data as unknown as CleanupWorkflowTriggersCommand;
            const triggerRegistry = TriggerRegistry.getInstance();
            Promise.all(
              cleanupCommand.workflowIds.map((workflowId) =>
                triggerRegistry.cleanupByWorkflow(workflowId),
              ),
            )
              .then(() => {
                sendResponse({ success: true });
              })
              .catch((error) => {
                console.error("Failed to cleanup workflow triggers:", error);
                sendResponse({ success: false, error: String(error) });
              });
            return true;
          }
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
                async (config: Record<string, any>, data?: any) => {
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
                    config,
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
              .then(() => {
                sendResponse({ success: true });
              })
              .catch((error: any) => {
                NotificationService.showErrorNotification({
                  title: `Error setting up trigger ${initTriggerCommand.nodeId}`,
                  message: error.message,
                });
                sendResponse({ success: false, error: error.message });
              });
            return true; // Indicate async response
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
              .then((result) => {
                if (result.success) {
                  sendResponse({
                    success: true,
                    data: result.data,
                    outputHandle: result.outputHandle,
                    config: result.config,
                  });
                } else {
                  NotificationService.showErrorNotification({
                    title: `Error executing ${executeActionCommand.nodeId}`,
                    message: result.error?.message,
                  });
                  sendResponse({
                    success: false,
                    error: result.error?.message,
                    config: result.config,
                  });
                }
              })
              .catch((error: any) => {
                NotificationService.showErrorNotification({
                  title: `Error executing ${executeActionCommand.nodeId}`,
                  message: error.message,
                });
                sendResponse({
                  success: false,
                  error: error.message,
                  config: undefined,
                });
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
    cleanUpHttpTriggers();
    (window as any).houdinExtensionInitialized = false;
  });
}
