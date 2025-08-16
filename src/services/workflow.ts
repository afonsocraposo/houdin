import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowExecutionContext,
} from "../types/workflow";
import { NotificationService } from "./notification";
import { ExecutionTracker } from "./executionTracker";
import { generateId } from "../utils/helpers";
import {
  sendMessageToBackground,
  sendMessageToContentScript,
} from "../lib/messages";
import {
  ActionCommand,
  TriggerCommand,
  WorkflowCommandType,
} from "../types/background-workflow";
import { ActionRegistry } from "./actionRegistry";
import { Action } from "webextension-polyfill";

export class ExecutionContext implements WorkflowExecutionContext {
  constructor(public outputs: Record<string, any> = {}) {}

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

      let result = output;
      if (property && typeof output === "object" && output !== null) {
        result = output[property];
      }

      if (result && typeof result === "object") {
        // If result is an object, convert to JSON string for display
        return JSON.stringify(result);
      }
      return String(result);
    });
  }
}

export class WorkflowExecutor {
  public readonly id: string;
  public readonly workflowId: string;
  private readonly tabId: number;
  private context: ExecutionContext;
  private executionTracker: ExecutionTracker;

  constructor(
    tabId: number,
    private workflow: WorkflowDefinition,
    private triggerNode: WorkflowNode,
    url: string,
    private onDone?: (executorId: string) => void,
  ) {
    this.id = generateId();
    this.workflowId = workflow.id;
    this.tabId = tabId;
    this.context = new ExecutionContext();
    this.executionTracker = new ExecutionTracker(
      workflow.id,
      this.id,
      url,
      triggerNode.data?.triggerType,
    );
  }

  async execute(): Promise<void> {
    if (!this.workflow.enabled) {
      console.debug("Workflow is disabled, skipping execution");
      return;
    }
    console.debug("Executing workflow:", this.workflow.name);

    try {
      // Find trigger nodes and set them up
      this.setupTrigger(this.triggerNode);
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

    // Send command to content script to set up the trigger
    const message: TriggerCommand = {
      type: WorkflowCommandType.INIT_TRIGGER,
      executionId: this.id,
      workflowId: this.workflow.id,
      tabId: this.tabId,
      nodeType: triggerType,
      nodeConfig: triggerConfig,
      nodeId: node.id,
      context: this.context,
    };
    try {
      const response = await sendMessageToContentScript(this.tabId, message);
      console.log("trigger response:", response);
      // Track the execution
      this.executionTracker.startExecution();
      this.executionTracker.addNodeResult({
        nodeId: this.triggerNode.id,
        nodeType: "trigger",
        nodeName: triggerType,
        nodeConfig: triggerConfig,
        data: response.data,
        status: "success",
        executedAt: Date.now(),
      });
      if (!response.success) {
        this.executionTracker.addNodeResult({
          nodeId: this.triggerNode.id,
          nodeType: "trigger",
          nodeName: triggerType,
          nodeConfig: triggerConfig,
          data: response.error,
          status: "error",
          executedAt: Date.now(),
        });
        throw new Error(
          `Failed to set up trigger ${triggerType}: ${response.error}`,
        );
      }

      this.onTriggerFired(response.data);
    } catch (error) {
      console.error("Error sending trigger setup message:", error);
    }
  }

  public onTriggerFired(result: any): void {
    console.debug(
      "Trigger fired for workflow:",
      this.workflow.name,
      this.triggerNode.type,
      result,
    );
    this.context.setOutput(this.triggerNode.id, result);
    // Find all actions connected to this trigger
    const connections = this.workflow.connections.filter(
      (conn) => conn.source === this.triggerNode.id,
    );

    for (const connection of connections) {
      const actionNode = this.workflow.nodes.find(
        (n) => n.id === connection.target,
      );
      if (actionNode && actionNode.type === "action") {
        this.executeAction(actionNode);
      }
    }
  }

  public onActionExecuted(nodeId: string, result: any): void {
    console.log("Action executed:", nodeId, result);
    this.context.setOutput(nodeId, result);
    // Find all actions connected to this node
    const connections = this.workflow.connections.filter(
      (conn) => conn.source === nodeId,
    );

    if (connections.length === 0) {
      console.debug("No further actions connected to node:", nodeId);
      this.destroy(true);
      return;
    }

    // Execute actions sequentially to ensure proper error propagation
    for (const connection of connections) {
      const actionNode = this.workflow.nodes.find(
        (n) => n.id === connection.target,
      );
      if (actionNode && actionNode.type === "action") {
        // This will throw an error if the action fails, stopping the workflow
        this.executeAction(actionNode);
      }
    }
  }

  private async executeAction(node: WorkflowNode): Promise<void> {
    const actionRegistry = ActionRegistry.getInstance();
    // Access trigger type correctly - it's stored as triggerType, not type
    const actionType = node.data?.actionType;
    const actionConfig = node.data?.config || {};

    const action = actionRegistry.getAction(actionType);
    const runBackground = action !== undefined;
    console.log("run in background", runBackground);

    // Send command to content script to set up the trigger
    const message: ActionCommand = {
      type: WorkflowCommandType.EXECUTE_ACTION,
      executionId: this.id,
      workflowId: this.workflow.id,
      tabId: this.tabId,
      nodeType: actionType,
      nodeConfig: actionConfig,
      nodeId: node.id,
      context: this.context,
    };
    try {
      const start = Date.now();

      const result = runBackground
        ? await this.executeActionInBackground(message)
        : await sendMessageToContentScript(this.tabId, message);

      const duration = Date.now() - start;
      if (!result || !result.success) {
        this.executionTracker.addNodeResult({
          nodeId: node.id,
          nodeType: "action",
          nodeName: actionType,
          nodeConfig: actionConfig,
          data: result?.error,
          status: "error",
          executedAt: start,
          duration,
        });
        throw new Error(
          `Failed to execute action ${actionType}: ${result?.error}`,
        );
      }
      // Track the execution result
      this.executionTracker.addNodeResult({
        nodeId: node.id,
        nodeType: "action",
        nodeName: actionType,
        nodeConfig: actionConfig,
        data: result.data,
        status: "success",
        executedAt: start,
        duration,
      });
      this.onActionExecuted(node.id, result.data);
    } catch (error) {
      console.error("Error executing action:", error);
      this.destroy(false);
    }
  }
  private async executeActionInBackground(
    message: ActionCommand,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const executeActionCommand = message as ActionCommand;
      const actionRegistry = ActionRegistry.getInstance();
      const context = new ExecutionContext(executeActionCommand.context);
      console.log(
        "Executing action in background:",
        executeActionCommand.nodeType,
      );
      try {
        actionRegistry.execute(
          executeActionCommand.nodeType,
          executeActionCommand.nodeConfig,
          context,
          executeActionCommand.nodeId,
          (data: any) =>
            resolve({
              success: true,
              data,
            }),
          (error: Error) => resolve({ success: false, error: error.message }),
        );
        // Set a timeout for the action execution
        setTimeout(() => {
          reject(new Error("Action execution timed out"));
        }, 10000); // 10 seconds timeout
      } catch (error: any) {
        resolve({ success: false, error: error.message });
      }
    });
  }

  destroy(success: boolean): void {
    this.onDone?.(this.id);
    this.executionTracker.completeExecution(success);
  }
}
