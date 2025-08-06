import {
  WorkflowDefinition,
  WorkflowNode,
  ActionNodeData,
  TriggerNodeData,
  WorkflowExecutionContext,
} from "../types/workflow";
import { copyToClipboard } from "../utils/helpers";
import { ComponentFactory } from "../components/ComponentFactory";
import { OpenAIService } from "./openai";
import { ModalService } from "./modal";
import { NotificationService } from "./notification";
import { ContentInjector } from "./injector";

class ExecutionContext implements WorkflowExecutionContext {
  outputs: Record<string, any> = {};

  setOutput(nodeId: string, value: any): void {
    this.outputs[nodeId] = value;
  }

  getOutput(nodeId: string): any {
    return this.outputs[nodeId];
  }

  interpolateVariables(text: string): string {
    if (!text) return text;

    // Replace variables in format {{nodeId}} or {{nodeId.property}}
    return text.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      const parts = expression.trim().split(".");
      const nodeId = parts[0];
      const property = parts[1];

      const output = this.getOutput(nodeId);
      if (output === undefined) return match; // Keep original if not found

      if (property && typeof output === "object" && output !== null) {
        return String(output[property] || match);
      }

      return String(output);
    });
  }
}

export class WorkflowExecutor {
  private observerTimeouts: Map<string, number> = new Map();
  private delayTimeouts: Map<string, number> = new Map();
  private eventListener: (event: Event) => void;
  private context: ExecutionContext;

  constructor(private workflow: WorkflowDefinition) {
    this.context = new ExecutionContext();

    // Set up listener for component triggers
    this.eventListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.workflowId === this.workflow.id) {
        this.context.setOutput(
          customEvent.detail.nodeId,
          customEvent.detail.data,
        );
        this.executeConnectedActionsFromNode(customEvent.detail.nodeId);
      }
    };
    document.addEventListener("workflow-component-trigger", this.eventListener);
  }

  async execute(): Promise<void> {
    console.log("Executing workflow:", this.workflow.name);

    if (!this.workflow.enabled) {
      console.log("Workflow is disabled, skipping execution");
      return;
    }

    try {
      // Find trigger nodes and set them up
      const triggerNodes = this.workflow.nodes.filter(
        (node) => node.type === "trigger",
      );

      for (const triggerNode of triggerNodes) {
        await this.setupTrigger(triggerNode);
      }
    } catch (error) {
      console.error("Error executing workflow:", error);
      NotificationService.showErrorNotification({
        message: `Error executing ${this.workflow.name}`,
      });
    }
  }

  private async setupTrigger(node: WorkflowNode): Promise<void> {
    const triggerData = node.data as TriggerNodeData;

    switch (triggerData.triggerType) {
      case "page-load":
        // Page is already loaded when this is called, so trigger immediately
        await this.executeConnectedActions(node);
        break;

      case "component-load":
        if (triggerData.config.selector) {
          await this.setupComponentLoadTrigger(
            node,
            triggerData.config.selector,
          );
        }
        break;

      case "delay":
        if (triggerData.config.delay) {
          await this.setupDelayTrigger(node, triggerData.config.delay);
        }
        break;
    }
  }

  private async setupComponentLoadTrigger(
    node: WorkflowNode,
    selector: string,
  ): Promise<void> {
    // Check if element already exists
    const existingElement = document.querySelector(selector);
    if (existingElement) {
      await this.executeConnectedActions(node);
      return;
    }

    // Set up observer to watch for element
    const observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            await this.executeConnectedActions(node);
            return;
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Clean up after 30 seconds to prevent memory leaks
    const timeoutId = window.setTimeout(() => {
      observer.disconnect();
      console.log(`Component load trigger timed out for selector: ${selector}`);
    }, 30000);

    this.observerTimeouts.set(node.id, timeoutId);
  }

  private async setupDelayTrigger(
    node: WorkflowNode,
    delay: number,
  ): Promise<void> {
    const timeoutId = window.setTimeout(async () => {
      await this.executeConnectedActions(node);
      this.delayTimeouts.delete(node.id);
    }, delay);

    this.delayTimeouts.set(node.id, timeoutId);
  }

  private async executeConnectedActions(
    triggerNode: WorkflowNode,
  ): Promise<void> {
    // Find all actions connected to this trigger
    const connections = this.workflow.connections.filter(
      (conn) => conn.source === triggerNode.id,
    );

    for (const connection of connections) {
      const actionNode = this.workflow.nodes.find(
        (n) => n.id === connection.target,
      );
      if (actionNode && actionNode.type === "action") {
        await this.executeAction(actionNode);
      }
    }
  }

  private async executeConnectedActionsFromNode(nodeId: string): Promise<void> {
    // Find all actions connected to this node
    const connections = this.workflow.connections.filter(
      (conn) => conn.source === nodeId,
    );

    for (const connection of connections) {
      const actionNode = this.workflow.nodes.find(
        (n) => n.id === connection.target,
      );
      if (actionNode && actionNode.type === "action") {
        await this.executeAction(actionNode);
      }
    }
  }

  private async executeAction(node: WorkflowNode): Promise<void> {
    const actionData = node.data as ActionNodeData;

    switch (actionData.actionType) {
      case "inject-component":
        await this.executeInjectComponent(actionData, node.id);
        break;
      case "get-element-content":
        await this.executeGetElementContent(actionData, node.id);
        break;
      case "copy-content":
        await this.executeCopyContent(actionData);
        break;
      case "show-modal":
        await this.executeShowModal(actionData);
        break;
      case "custom-script":
        await this.executeCustomScript(actionData, node.id);
        break;
      case "llm-openai":
        await this.executeLLMOpenAI(actionData, node.id);
        break;
    }
  }

  private async executeGetElementContent(
    actionData: ActionNodeData,
    nodeId: string,
  ): Promise<void> {
    const element = document.querySelector(
      actionData.config.elementSelector || "",
    );
    if (element) {
      const textContent = element.textContent || "";
      // Store the output in the execution context
      this.context.setOutput(nodeId, textContent);
    } else {
      NotificationService.showErrorNotification({
        message: "Element not found for content extraction",
      });
      this.context.setOutput(nodeId, "");
    }

    // Execute connected actions after capturing content
    await this.executeConnectedActionsFromNode(nodeId);
  }

  private async executeInjectComponent(
    actionData: ActionNodeData,
    nodeId: string,
  ): Promise<void> {
    const targetElement = document.querySelector(
      actionData.config.targetSelector || "body",
    );
    if (!targetElement) {
      NotificationService.showErrorNotification({
        message: "Target element not found for component injection",
      });
      return;
    }

    // Only pass workflow info for interactive components (button/input)
    if (actionData.config.componentText) {
      actionData.config.componentText = this.context.interpolateVariables(
        actionData.config.componentText,
      );
    }
    const component = ComponentFactory.create(
      actionData.config,
      this.workflow.id,
      nodeId,
    );
    ContentInjector.injectMantineComponentInTarget(
      `container-${this.workflow.id}`,
      component,
      targetElement,
    );
  }

  private async executeCopyContent(actionData: ActionNodeData): Promise<void> {
    const sourceElement = document.querySelector(
      actionData.config.sourceSelector || "",
    );
    if (sourceElement) {
      const textContent = sourceElement.textContent || "";
      await copyToClipboard(textContent);
      NotificationService.showNotification({
        title: "Content copied to clipboard!",
      });
    } else {
      NotificationService.showErrorNotification({
        message: "Source element not found",
      });
    }
  }

  private async executeShowModal(actionData: ActionNodeData): Promise<void> {
    let modalTitle = this.context.interpolateVariables(
      actionData.config.modalTitle || "Workflow Result",
    );
    let modalContent = this.context.interpolateVariables(
      actionData.config.modalContent || "",
    );

    ModalService.showModal({ title: modalTitle, content: modalContent });
  }

  private async executeCustomScript(
    actionData: ActionNodeData,
    nodeId: string,
  ): Promise<void> {
    if (actionData.config.customScript) {
      try {
        // Create a promise that resolves when the script sends back data
        const result = await this.executeScriptWithOutput(
          actionData.config.customScript,
          nodeId,
        );

        // Store the output in the execution context
        this.context.setOutput(nodeId, result);

        // Execute connected actions after receiving response
        await this.executeConnectedActionsFromNode(nodeId);
      } catch (error) {
        console.error("Error executing custom script:", error);
        NotificationService.showErrorNotification({
          message: "Error executing custom script",
        });
        this.context.setOutput(nodeId, ""); // Store empty on error
      }
    }
  }

  private executeScriptWithOutput(
    scriptCode: string,
    nodeId: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Script execution timeout"));
      }, 10000); // 10 second timeout

      // Listen for response from injected script
      const responseHandler = (event: CustomEvent) => {
        if (event.detail?.nodeId === nodeId) {
          clearTimeout(timeoutId);
          window.removeEventListener(
            "workflow-script-response",
            responseHandler as EventListener,
          );
          resolve(event.detail.result);
        }
      };

      window.addEventListener(
        "workflow-script-response",
        responseHandler as EventListener,
      );

      // Inject script that includes response mechanism
      const wrappedScript = `
            (function() {
                try {
                    // Your custom script code here
                    ${scriptCode}

                    // If script doesn't manually send response, send undefined
                    // Scripts can override this by calling sendWorkflowResponse() themselves
                    if (typeof Return !== 'function') {
                        window.dispatchEvent(new CustomEvent('workflow-script-response', {
                            detail: { nodeId: '${nodeId}', result: undefined }
                        }));
                    }
                } catch (error) {
                    window.dispatchEvent(new CustomEvent('workflow-script-response', {
                        detail: { nodeId: '${nodeId}', result: null, error: error.message }
                    }));
                }
            })();

            // Helper function for scripts to send data back
            function Return(data) {
                window.dispatchEvent(new CustomEvent('workflow-script-response', {
                    detail: { nodeId: '${nodeId}', result: data }
                }));
            }
        `;

      this.injectInlineScript(wrappedScript);
    });
  }

  private injectInlineScript(code: string) {
    const script = document.createElement("script");
    script.textContent = code;
    document.head.appendChild(script);
    script.remove(); // Clean up
  }

  private async executeLLMOpenAI(
    actionData: ActionNodeData,
    nodeId: string,
  ): Promise<void> {
    try {
      const { credentialId, model, prompt, maxTokens, temperature } =
        actionData.config;

      if (!credentialId) {
        NotificationService.showErrorNotification({
          message: "No OpenAI credential selected",
        });
        return;
      }

      if (!prompt) {
        NotificationService.showErrorNotification({
          message: "No prompt provided for OpenAI",
        });
        return;
      }

      // Interpolate variables in the prompt
      const interpolatedPrompt = this.context.interpolateVariables(prompt);

      // Show loading notification
      NotificationService.showNotification({
        title: "Calling OpenAI API...",
      });

      // Call OpenAI API
      const response = await OpenAIService.callChatCompletion(
        credentialId,
        model || "gpt-3.5-turbo",
        interpolatedPrompt,
        maxTokens || 150,
        temperature || 0.7,
      );

      // Store the response in the execution context
      this.context.setOutput(nodeId, response);

      // Execute connected actions after receiving response
      await this.executeConnectedActionsFromNode(nodeId);
    } catch (error) {
      console.error("Error executing OpenAI action:", error);
      NotificationService.showErrorNotification({
        message: `OpenAI API error: ${error}`,
      });
      // Store empty response on error
      this.context.setOutput(nodeId, "");
    }
  }

  destroy(): void {
    // Clean up any active timeouts and observers
    this.observerTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.observerTimeouts.clear();

    this.delayTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.delayTimeouts.clear();

    // Remove event listener
    document.removeEventListener(
      "workflow-component-trigger",
      this.eventListener,
    );
  }
}
