import {
  WorkflowDefinition,
  WorkflowNode,
  ActionNodeData,
  TriggerNodeData,
  WorkflowExecutionContext,
} from "../types/workflow";
import { NotificationService } from "./notification";
import { ActionRegistry } from "./actionRegistry";

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
    const actionRegistry = ActionRegistry.getInstance();

    // Try to execute with the new action system first
    if (actionRegistry.hasAction(actionData.actionType)) {
      try {
        // Create extended context with workflow ID
        const extendedContext = Object.assign(this.context, {
          workflowId: this.workflow.id
        });

        await actionRegistry.execute(
          actionData.actionType,
          actionData.config,
          extendedContext,
          node.id
        );
        
        // Execute connected actions after completion (for actions that need it)
        if (actionData.actionType === "get-element-content" || actionData.actionType === "custom-script" || actionData.actionType === "llm-openai") {
          await this.executeConnectedActionsFromNode(node.id);
        }
        
        return;
      } catch (error) {
        console.error(`Error executing action ${actionData.actionType}:`, error);
        NotificationService.showErrorNotification({
          message: `Error executing ${actionData.actionType}: ${error}`,
        });
        return;
      }
    }

    // Fallback: No actions should reach here anymore since we've converted them all
    console.error(`Unknown action type: ${actionData.actionType}`);
    NotificationService.showErrorNotification({
      message: `Unknown action type: ${actionData.actionType}`,
    });
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
