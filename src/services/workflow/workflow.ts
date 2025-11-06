import {
  WorkflowDefinition,
  WorkflowNode,
  TriggerNodeData,
  ActionNodeData,
} from "@/types/workflow";
import { ExecutionTracker } from "../executionTracker";
import { newExecutionId } from "@/utils/helpers";
import { sendMessageToContentScript } from "@/lib/messages";
import cloneDeep from "lodash/cloneDeep";
import {
  ActionCommand,
  StatusMessage,
  WorkflowCommandType,
} from "@/types/background-workflow";
import { ActionRegistry } from "../actionRegistry";
import { NotificationService } from "../notification";
import { ExecutionContext } from "./executionContext";
import { BackgroundWorkflowEngine } from "../backgroundEngine";

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
    this.id = newExecutionId();
    this.workflowId = workflow.id;
    this.workflow = workflow;
    this.tabId = tabId;
    this.context = new ExecutionContext(
      {
        workflowId: this.workflowId,
        executionId: this.id,
        url: url,
        startedAt: Date.now(),
      },
      workflow.variables || {},
    );
    this.executionTracker = new ExecutionTracker(
      workflow.id,
      this.id,
      url,
      (triggerNode.data as TriggerNodeData)?.type,
    );
  }

  async start(
    triggerData: any,
    duration: number,
    config: Record<string, any>,
  ): Promise<void> {
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
      nodeName: (this.triggerNode.data as TriggerNodeData)?.type || "unknown",
      nodeConfig: config || this.triggerNode.data?.config || {},
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

  public onActionExecuted(
    nodeId: string,
    result: any,
    outputHandle?: string,
  ): void {
    console.debug(
      "Action executed:",
      nodeId,
      result,
      "outputHandle:",
      outputHandle,
    );
    this.context.setOutput(nodeId, result);

    // Find connections from this node, filtered by output handle if specified
    const connections = this.workflow.connections.filter((conn) => {
      if (conn.source !== nodeId) return false;

      // If outputHandle is specified, only follow connections from that handle
      if (outputHandle) {
        return conn.sourceHandle === outputHandle;
      }

      return true;
    });

    if (connections.length === 0) {
      this.nodesProcessing.delete(nodeId);
      console.debug(
        "No further actions connected to node:",
        nodeId,
        "via handle:",
        outputHandle,
      );
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
    try {
      this.nodesProcessing.add(node.id);
      const actionRegistry = ActionRegistry.getInstance();
      // Access trigger type correctly - it's stored as triggerType, not type
      const actionType = (node.data as ActionNodeData)?.type;
      const actionConfig = cloneDeep(node.data?.config || {});

      try {
        // iterate object properties and interpolate variables
        for (const key in actionConfig) {
          if (actionConfig.hasOwnProperty(key)) {
            const value = actionConfig[key];
            if (typeof value === "string") {
              actionConfig[key] = this.context.interpolateVariables(value);
            }
          }
        }
      } catch (error) {
        this.executionTracker.addNodeResult({
          nodeId: node.id,
          nodeType: "action",
          nodeName: actionType,
          nodeConfig: actionConfig,
          data: `Error interpolating action config: ${error}`,
          status: "error",
          executedAt: Date.now(),
          duration: 0,
        });
        throw new Error(`Error interpolating action config: ${error}`);
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
      const start = Date.now();

      // For content script actions, ensure content script is ready before executing
      const isReady = await BackgroundWorkflowEngine.waitForContentScriptReady(
        this.tabId,
      );
      if (!isReady) {
        this.executionTracker.addNodeResult({
          nodeId: node.id,
          nodeType: "action",
          nodeName: actionType,
          nodeConfig: actionConfig,
          data: "Timeout waiting for content script to be ready",
          status: "error",
          executedAt: start,
          duration: Date.now() - start,
        });
        throw new Error("Timed out waiting for content script to be ready");
      }

      const result = runBackground
        ? await this.executeActionInBackground(message)
        : ((await sendMessageToContentScript<ActionCommand>(
            this.tabId,
            WorkflowCommandType.EXECUTE_ACTION,
            message,
          )) as StatusMessage);

      const duration = Date.now() - start;
      if (!result || !result.success) {
        this.executionTracker.addNodeResult({
          nodeId: node.id,
          nodeType: "action",
          nodeName: actionType,
          nodeConfig: result.config ?? actionConfig,
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
        nodeConfig: result.config ?? actionConfig,
        data: result.data,
        status: "success",
        executedAt: start,
        duration,
      });
      this.onActionExecuted(node.id, result.data, result.outputHandle);
    } catch (error: any) {
      console.error("Error executing action:", error);
      NotificationService.showErrorNotificationFromBackground({
        title: `Error executing action ${node.id} in workflow ${this.workflow.id}`,
        message: error.message,
      });
      this.destroy(false, true);
    }
  }
  private executeActionInBackground(
    message: ActionCommand,
  ): Promise<StatusMessage> {
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
        .then((result) =>
          resolve({
            success: true,
            data: result.data,
            outputHandle: result.outputHandle,
          }),
        )
        .catch((error) => {
          NotificationService.showErrorNotificationFromBackground({
            title: `Error executing ${executeActionCommand.nodeId}`,
            message: error.message,
          });
          return resolve({ success: false, error: error.message });
        });
    });
  }

  destroy(success: boolean, force: boolean = false): void {
    console.debug("destroying", this.nodesProcessing);
    if (!force && this.nodesProcessing.size !== 0) {
      return;
    }
    this.onDone?.(this.id);
    this.executionTracker.completeExecution(success);
  }
}
