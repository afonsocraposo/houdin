import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowExecutionContext,
} from "../types/workflow";
import { NotificationService } from "./notification";
import { ActionRegistry } from "./actionRegistry";
import { TriggerRegistry, initializeTriggers } from "./triggerInitializer";
import { TriggerExecutionContext } from "../types/triggers";
import { initializeActions } from "./actionInitializer";
import { initializeCredentials } from "./credentialInitializer";

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

    // Initialize registries
    initializeTriggers();
    initializeActions();
    initializeCredentials();
    
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
    if (!this.workflow.enabled) {
      console.debug("Workflow is disabled, skipping execution");
      return;
    }
    console.log("Executing workflow:", this.workflow.name);

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
    // Access trigger type correctly - it's stored as triggerType, not type
    const triggerType = node.data?.triggerType;
    const triggerConfig = node.data?.config || {};

    if (!triggerType) {
      console.error(
        "No trigger type found for node:",
        node.id,
        "node.data:",
        node.data,
      );
      return;
    }

    // Create trigger execution context
    const triggerContext: TriggerExecutionContext = Object.assign(
      this.context,
      {
        workflowId: this.workflow.id,
        triggerNode: node,
      },
    );

    // Use trigger registry to setup the trigger
    try {
      await this.triggerRegistry.setupTrigger(
        triggerType,
        triggerConfig,
        triggerContext,
        async () => {
          await this.executeConnectedActions(node);
        },
      );
    } catch (error) {
      console.error(`Error setting up trigger ${triggerType}:`, error);
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
    // Access action type correctly - it's stored as actionType, not type
    const actionType = node.data?.actionType;
    const actionConfig = node.data?.config || {};
    const actionRegistry = ActionRegistry.getInstance();

    if (!actionType) {
      console.error(
        "No action type found for node:",
        node.id,
        "node.data:",
        node.data,
      );
      return;
    }

    // Try to execute with the new action system first
    if (actionRegistry.hasAction(actionType)) {
      try {
        // Create extended context with workflow ID
        const extendedContext = Object.assign(this.context, {
          workflowId: this.workflow.id,
        });

        await actionRegistry.execute(
          actionType,
          actionConfig,
          extendedContext,
          node.id,
        );

        // Execute connected actions after completion (for actions that need it)
        const action = actionRegistry.getAction(actionType);
        if (action?.metadata.completion) {
          await this.executeConnectedActionsFromNode(node.id);
        }

        return;
      } catch (error) {
        console.error(`Error executing action ${actionType}:`, error);
        NotificationService.showErrorNotification({
          message: `Error executing ${actionType}: ${error}`,
        });
        return;
      }
    }

    // Fallback: No actions should reach here anymore since we've converted them all
    console.error(`Unknown action type: ${actionType}`);
    NotificationService.showErrorNotification({
      message: `Unknown action type: ${actionType}`,
    });
  }

  destroy(): void {
    // Clean up only triggers for this workflow's nodes
    const triggerNodes = this.workflow.nodes.filter(
      (node) => node.type === "trigger",
    );

    triggerNodes.forEach((node) => {
      this.triggerRegistry.cleanupTrigger(node.id);
    });

    // Remove event listener
    document.removeEventListener(
      "workflow-component-trigger",
      this.eventListener,
    );
  }
}
