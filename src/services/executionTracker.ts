import { WorkflowExecution, NodeExecutionResult } from "../types/workflow";
import { generateId } from "../utils/helpers";

class ExecutionTracker {
  private static instance: ExecutionTracker;
  private executions: Map<string, WorkflowExecution> = new Map();
  private isContentScript: boolean;

  constructor() {
    this.isContentScript = typeof window !== 'undefined' && window.location !== undefined;
  }

  static getInstance(): ExecutionTracker {
    if (!ExecutionTracker.instance) {
      ExecutionTracker.instance = new ExecutionTracker();
    }
    return ExecutionTracker.instance;
  }

  private sendMessage(type: string, data: any): void {
    if (this.isContentScript && typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        console.debug(`ExecutionTracker: Sending message ${type}:`, data);
        chrome.runtime.sendMessage({
          type,
          data
        });
      } catch (error) {
        console.debug("Failed to send execution tracking message:", error);
      }
    }
  }

  startExecution(workflowId: string, triggerType?: string, triggerData?: any): string {
    const executionId = generateId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      startedAt: Date.now(),
      status: "running",
      nodeResults: [],
      trigger: triggerType ? { type: triggerType, data: triggerData } : undefined,
    };

    this.executions.set(executionId, execution);
    console.debug(`ExecutionTracker: Started execution ${executionId} for workflow ${workflowId}`);
    
    // Send message to background script
    this.sendMessage("EXECUTION_STARTED", execution);
    
    return executionId;
  }

  completeExecution(executionId: string, status: "completed" | "failed"): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = status;
      execution.completedAt = Date.now();
      
      // Send message to background script
      this.sendMessage("EXECUTION_COMPLETED", { executionId, status, completedAt: execution.completedAt });
    }
  }

  addNodeResult(executionId: string, nodeResult: NodeExecutionResult): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.nodeResults.push(nodeResult);
      console.debug(`ExecutionTracker: Added node result for execution ${executionId}:`, nodeResult);
      
      // Send message to background script
      this.sendMessage("NODE_RESULT_ADDED", { executionId, nodeResult });
    } else {
      console.warn(`ExecutionTracker: Could not find execution ${executionId} to add node result`);
    }
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutionsForWorkflow(workflowId: string): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  // Method to sync executions from background script (for popup)
  syncExecutions(executions: WorkflowExecution[]): void {
    this.executions.clear();
    executions.forEach(exec => {
      this.executions.set(exec.id, exec);
    });
  }

  clearExecutions(): void {
    this.executions.clear();
    this.sendMessage("EXECUTIONS_CLEARED", {});
  }

  getExecutionStats(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
  } {
    const executions = Array.from(this.executions.values());
    return {
      total: executions.length,
      running: executions.filter(e => e.status === "running").length,
      completed: executions.filter(e => e.status === "completed").length,
      failed: executions.filter(e => e.status === "failed").length,
    };
  }
}

export { ExecutionTracker };