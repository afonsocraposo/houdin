import {
  WorkflowDefinition,
  WorkflowNode,
  ActionNodeData,
  TriggerNodeData,
  WorkflowExecutionContext,
} from "../types/workflow";
import { NotificationService } from "./notification";
import { ActionRegistry } from "./actionRegistry";
import { TriggerRegistry, initializeTriggers } from "./triggerInitializer";
import { TriggerExecutionContext } from "../types/triggers";

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
  private context: ExecutionContext;
  private eventListener: (event: Event) => void;
  private triggerRegistry: TriggerRegistry;

  constructor(private workflow: WorkflowDefinition) {
    this.context = new ExecutionContext();
    
    // Initialize triggers registry
    initializeTriggers();
    this.triggerRegistry = TriggerRegistry.getInstance();

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
    
    // Create trigger execution context
    const triggerContext: TriggerExecutionContext = Object.assign(this.context, {
      workflowId: this.workflow.id,
      triggerNode: node
    });

    // Use trigger registry to setup the trigger
    try {
      await this.triggerRegistry.setupTrigger(
        triggerData.triggerType,
        triggerData.config,
        triggerContext,
        async () => {
          await this.executeConnectedActions(node);
        }
      );
    } catch (error) {
      console.error(`Error setting up trigger ${triggerData.triggerType}:`, error);
      NotificationService.showErrorNotification({
        message: `Error setting up trigger: ${error}`,
      });
    }
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
    // Clean up all active triggers using the trigger registry
    this.triggerRegistry.cleanupAllTriggers();

    // Remove event listener
    document.removeEventListener(
      "workflow-component-trigger",
      this.eventListener,
    );
  }
}
