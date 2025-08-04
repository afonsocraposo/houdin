import {
  WorkflowDefinition,
  WorkflowNode,
  ActionNodeData,
  TriggerNodeData,
  WorkflowExecutionContext,
} from "../types/workflow";
import { copyToClipboard, showNotification } from "../utils/helpers";
import { createModal } from "../components/Modal";
import { ComponentFactory } from "../components/ComponentFactory";
import { OpenAIService } from "./openai";

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
      showNotification(`Error executing ${this.workflow.name}`, "error");
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
        await this.executeCustomScript(actionData);
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
      showNotification("Element not found for content extraction", "error");
      this.context.setOutput(nodeId, "");
    }

    // Execute connected actions after capturing content
    await this.executeConnectedActionsFromNode(nodeId);
  }

  private async executeInjectComponent(
    actionData: ActionNodeData,
    nodeId?: string,
  ): Promise<void> {
    const targetElement = document.querySelector(
      actionData.config.targetSelector || "body",
    );
    if (!targetElement) {
      showNotification(
        "Target element not found for component injection",
        "error",
      );
      return;
    }

    // Only pass workflow info for interactive components (button/input)
    const isInteractive =
      actionData.config.componentType === "button" ||
      actionData.config.componentType === "input";
    const component = ComponentFactory.create(
      actionData.config,
      isInteractive ? this.workflow.id : undefined,
      isInteractive ? nodeId : undefined,
    );
    component.setAttribute("data-workflow-injected", "true");
    component.setAttribute("data-workflow-id", this.workflow.id);
    targetElement.appendChild(component);
  }

  private async executeCopyContent(actionData: ActionNodeData): Promise<void> {
    const sourceElement = document.querySelector(
      actionData.config.sourceSelector || "",
    );
    if (sourceElement) {
      const textContent = sourceElement.textContent || "";
      await copyToClipboard(textContent);
      showNotification("Content copied to clipboard!");
    } else {
      showNotification("Source element not found", "error");
    }
  }

  private async executeShowModal(actionData: ActionNodeData): Promise<void> {
    let modalTitle = this.context.interpolateVariables(
      actionData.config.modalTitle || "Workflow Result",
    );
    let modalContent = this.context.interpolateVariables(
      actionData.config.modalContent || "",
    );

    // Legacy support: If sourceSelector is provided, append its content
    if (actionData.config.sourceSelector) {
      const sourceElement = document.querySelector(
        actionData.config.sourceSelector,
      );
      if (sourceElement) {
        const textContent = sourceElement.textContent || "";
        modalContent += "\n\n" + textContent;
      }
    }

    createModal(modalTitle, modalContent);
  }

  private async executeCustomScript(actionData: ActionNodeData): Promise<void> {
    if (actionData.config.customScript) {
      try {
        const func = new Function(actionData.config.customScript);
        func();
      } catch (error) {
        console.error("Error executing custom script:", error);
        showNotification("Error executing custom script", "error");
      }
    }
  }

  private async executeLLMOpenAI(
    actionData: ActionNodeData,
    nodeId: string,
  ): Promise<void> {
    try {
      const { credentialId, model, prompt, maxTokens, temperature } = actionData.config;

      if (!credentialId) {
        showNotification("No OpenAI credential selected", "error");
        return;
      }

      if (!prompt) {
        showNotification("No prompt provided for OpenAI", "error");
        return;
      }

      // Interpolate variables in the prompt
      const interpolatedPrompt = this.context.interpolateVariables(prompt);

      // Show loading notification
      showNotification("Calling OpenAI API...");

      // Call OpenAI API
      const response = await OpenAIService.callChatCompletion(
        credentialId,
        model || 'gpt-3.5-turbo',
        interpolatedPrompt,
        maxTokens || 150,
        temperature || 0.7
      );

      // Store the response in the execution context
      this.context.setOutput(nodeId, response);

      // Show success notification
      showNotification("OpenAI response received");

      // Execute connected actions after receiving response
      await this.executeConnectedActionsFromNode(nodeId);
    } catch (error) {
      console.error("Error executing OpenAI action:", error);
      showNotification(`OpenAI API error: ${error}`, "error");
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
