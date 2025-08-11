import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowExecutionContext,
  NodeExecutionResult,
} from "../types/workflow";
import { NotificationService } from "./notification";
import { ActionRegistry } from "./actionRegistry";
import { TriggerRegistry, initializeTriggers } from "./triggerInitializer";
import { TriggerExecutionContext } from "../types/triggers";
import { initializeActions } from "./actionInitializer";
import { initializeCredentials } from "./credentialInitializer";
import { ExecutionTracker } from "./executionTracker";

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
        return JSON.stringify(output[property] || match);
      }

      return output;
    });
  }
}

export class WorkflowExecutor {
  private context: ExecutionContext;
  private eventListener: (event: Event) => void;
  private triggerRegistry: TriggerRegistry;
  private executionTracker: ExecutionTracker;
  private currentExecutionId?: string;

  constructor(private workflow: WorkflowDefinition) {
    this.context = new ExecutionContext();
    this.executionTracker = ExecutionTracker.getInstance();

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
    console.debug("Executing workflow:", this.workflow.name);

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
          // Start execution tracking when trigger fires
          this.currentExecutionId = this.executionTracker.startExecution(
            this.workflow.id,
            triggerType,
            triggerConfig,
          );

          console.debug(
            `Trigger fired, started execution ${this.currentExecutionId} for workflow ${this.workflow.id}`,
          );

          // Record trigger node result
          const triggerResult: NodeExecutionResult = {
            nodeId: node.id,
            status: "success",
            output: { triggerType, config: triggerConfig },
            executedAt: Date.now(),
            duration: 0,
          };

          if (this.currentExecutionId) {
            console.debug(`Adding trigger node result:`, triggerResult);
            this.executionTracker.addNodeResult(
              this.currentExecutionId,
              triggerResult,
            );
          }

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

    try {
      for (const connection of connections) {
        const actionNode = this.workflow.nodes.find(
          (n) => n.id === connection.target,
        );
        if (actionNode && actionNode.type === "action") {
          await this.executeAction(actionNode);
        }
      }

      // Mark execution as completed - ExecutionTracker will auto-determine final status
      if (this.currentExecutionId) {
        this.executionTracker.completeExecution(
          this.currentExecutionId,
          "completed",
        );
        this.currentExecutionId = undefined;
      }
    } catch (error) {
      // Mark execution as failed if we have one
      if (this.currentExecutionId) {
        this.executionTracker.completeExecution(
          this.currentExecutionId,
          "failed",
        );
        this.currentExecutionId = undefined;
      }
      throw error;
    }
  }

  private async executeConnectedActionsFromNode(nodeId: string): Promise<void> {
    // Find all actions connected to this node
    const connections = this.workflow.connections.filter(
      (conn) => conn.source === nodeId,
    );

    // Execute actions sequentially to ensure proper error propagation
    for (const connection of connections) {
      const actionNode = this.workflow.nodes.find(
        (n) => n.id === connection.target,
      );
      if (actionNode && actionNode.type === "action") {
        // This will throw an error if the action fails, stopping the workflow
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
      const errorMsg = `No action type found for node: ${node.id}`;
      console.error(errorMsg, "node.data:", node.data);
      
      const nodeResult: NodeExecutionResult = {
        nodeId: node.id,
        status: "error",
        error: errorMsg,
        executedAt: Date.now(),
        duration: 0,
      };
      
      if (this.currentExecutionId) {
        this.executionTracker.addNodeResult(this.currentExecutionId, nodeResult);
      }
      
      throw new Error(errorMsg);
    }

    const startTime = Date.now();
    let nodeResult: NodeExecutionResult;

    console.debug(
      `Executing action ${actionType} for node ${node.id}, execution: ${this.currentExecutionId}`,
    );

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

        nodeResult = {
          nodeId: node.id,
          status: "success",
          output: extendedContext.getOutput(node.id),
          executedAt: startTime,
          duration: Date.now() - startTime,
        };

        console.debug(
          `Action completed successfully for node ${node.id}:`,
          nodeResult,
        );

        // Add successful node result to execution tracker
        if (this.currentExecutionId) {
          this.executionTracker.addNodeResult(this.currentExecutionId, nodeResult);
        }

        // Execute connected actions after completion
        await this.executeConnectedActionsFromNode(node.id);
      } catch (error) {
        nodeResult = {
          nodeId: node.id,
          status: "error",
          error: error instanceof Error ? error.message : String(error),
          executedAt: startTime,
          duration: Date.now() - startTime,
        };

        console.error(`Error executing action ${actionType}:`, error);
        
        // Add failed node result to execution tracker
        if (this.currentExecutionId) {
          this.executionTracker.addNodeResult(this.currentExecutionId, nodeResult);
        }
        
        NotificationService.showErrorNotification({
          message: `Error executing ${actionType}: ${error instanceof Error ? error.message : error}`,
        });
        
        // Throw error to stop workflow execution
        throw error;
      }
    } else {
      const errorMsg = `Unknown action type: ${actionType}`;
      nodeResult = {
        nodeId: node.id,
        status: "error",
        error: errorMsg,
        executedAt: startTime,
        duration: Date.now() - startTime,
      };

      console.error(errorMsg);
      
      // Add failed node result to execution tracker
      if (this.currentExecutionId) {
        this.executionTracker.addNodeResult(this.currentExecutionId, nodeResult);
      }
      
      NotificationService.showErrorNotification({
        message: errorMsg,
      });
      
      // Throw error to stop workflow execution
      throw new Error(errorMsg);
    }
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
