import {
  WorkflowDefinition,
  WorkflowNode,
  WorkflowExecutionContext,
} from "../types/workflow";
import { ExecutionTracker } from "./executionTracker";
import { deepCopy, generateId } from "../utils/helpers";
import { sendMessageToContentScript } from "../lib/messages";
import {
  ActionCommand,
  WorkflowCommandType,
} from "../types/background-workflow";
import { ActionRegistry } from "./actionRegistry";

export class ExecutionContext implements WorkflowExecutionContext {
  public outputs: Record<string, any>;
  constructor() {
    this.outputs = {};
  }

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
      const properties = parts.slice(1);

      const output = this.getOutput(nodeId);
      if (output === undefined) return match; // Keep original if not found

      let result = output;
      let i = 0;
      while (
        i < properties.length &&
        typeof output === "object" &&
        output !== null
      ) {
        const property = properties[i];
        if (!(property in result)) {
          break;
        }
        result = result[property];
        i++;
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
  public readonly tabId: number;
  private context: ExecutionContext;
  private executionTracker: ExecutionTracker;
  private readonly workflow: WorkflowDefinition;
  private nodesProcessing: Set<string> = new Set();

  constructor(
    tabId: number,
    workflow: WorkflowDefinition,
    private triggerNode: WorkflowNode,
    url: string,
    private onDone?: (executorId: string) => void,
  ) {
    this.id = generateId();
    this.workflowId = workflow.id;
    this.workflow = workflow;
    this.tabId = tabId;
    this.context = new ExecutionContext();
    this.executionTracker = new ExecutionTracker(
      workflow.id,
      this.id,
      url,
      triggerNode.data?.triggerType,
    );
  }

  async start(triggerData: any, duration: number): Promise<void> {
    console.debug(
      "Trigger fired for workflow:",
      this.workflow.name,
      this.triggerNode.type,
      triggerData,
    );
    this.context.setOutput(this.triggerNode.id, triggerData);
    this.executionTracker.startExecution();
    this.executionTracker.addNodeResult({
      nodeId: this.triggerNode.id,
      nodeType: "trigger",
      nodeName: this.triggerNode.data?.triggerType || "unknown",
      nodeConfig: this.triggerNode.data?.config || {},
      data: triggerData,
      status: "success",
      executedAt: Date.now(),
      duration, // Duration will be updated later
    });
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
    console.debug("Action executed:", nodeId, result);
    this.context.setOutput(nodeId, result);
    // Find all actions connected to this node
    const connections = this.workflow.connections.filter(
      (conn) => conn.source === nodeId,
    );

    if (connections.length === 0) {
      this.nodesProcessing.delete(nodeId);
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
    this.nodesProcessing.delete(nodeId);
  }

  private async executeAction(node: WorkflowNode): Promise<void> {
    this.nodesProcessing.add(node.id);
    const actionRegistry = ActionRegistry.getInstance();
    // Access trigger type correctly - it's stored as triggerType, not type
    const actionType = node.data?.actionType;
    const actionConfig: Object = deepCopy(node.data?.config || {});

    // iterate object properties and interpolate variables
    for (const key in actionConfig) {
      if (actionConfig.hasOwnProperty(key)) {
        //@ts-ignore
        const value = actionConfig[key];
        if (typeof value === "string") {
          //@ts-ignore
          actionConfig[key] = this.context.interpolateVariables(value);
        }
      }
    }

    const action = actionRegistry.getAction(actionType);
    const runBackground = action !== undefined;

    // Send command to content script to set up the trigger
    const message: ActionCommand = {
      type: WorkflowCommandType.EXECUTE_ACTION,
      executionId: this.id,
      workflowId: this.workflow.id,
      tabId: this.tabId,
      nodeType: actionType,
      nodeConfig: actionConfig,
      nodeId: node.id,
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
        throw new Error(`Action ${actionType}: ${result?.error}`);
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
      this.destroy(false, true);
    }
  }
  private executeActionInBackground(message: ActionCommand): Promise<any> {
    return new Promise(async (resolve) => {
      const executeActionCommand = message as ActionCommand;
      const actionRegistry = ActionRegistry.getInstance();
      actionRegistry
        .execute(
          executeActionCommand.nodeType,
          executeActionCommand.nodeConfig,
          executeActionCommand.workflowId,
          executeActionCommand.nodeId,
          this.tabId,
        )
        .then((result) => resolve({ success: true, data: result }))
        .catch((error) => resolve({ success: false, error: error.message }));
    });
  }

  destroy(success: boolean, force: boolean = false): void {
    console.log("destroying", this.nodesProcessing);
    if (!force && this.nodesProcessing.size !== 0) {
      return;
    }
    this.onDone?.(this.id);
    this.executionTracker.completeExecution(success);
  }
}
