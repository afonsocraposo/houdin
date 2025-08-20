import {
  NodeExecutionResult,
  WorkflowExecution,
  WorkflowExecutionStatus,
} from "../types/workflow";
import { StorageManager } from "./storage";

export class ExecutionTracker {
  public status: WorkflowExecutionStatus = WorkflowExecutionStatus.WAITING;
  public success: boolean | undefined;
  public startedAt: number = Date.now();
  public completedAt?: number;
  public readonly nodeResults: NodeExecutionResult[] = [];

  constructor(
    public readonly workflowId: string,
    public readonly executionId: string,
    public readonly url: string,
    public readonly trigger: string = "unknown",
  ) {}

  startExecution(): void {
    this.status = WorkflowExecutionStatus.IN_PROGRESS;
  }

  completeExecution(success: boolean): void {
    if (success) {
      this.status = WorkflowExecutionStatus.COMPLETED;
    } else {
      this.status = WorkflowExecutionStatus.FAILED;
    }
    this.completedAt = Date.now();
    this.success = success;
    console.debug(this.nodeResults);
    this.saveExecution();
  }

  addNodeResult(nodeResult: NodeExecutionResult): void {
    this.nodeResults.push(nodeResult);
  }

  private async saveExecution(): Promise<void> {
    const storageManager = StorageManager.getInstance();
    await storageManager.saveWorkflowExecution(this.getWorkflowExecution());
  }

  private getWorkflowExecution(): WorkflowExecution {
    const workflowExecution: WorkflowExecution = {
      id: this.executionId,
      workflowId: this.workflowId,
      triggerType: this.trigger,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      status: this.status,
      nodeResults: this.nodeResults,
      url: this.url,
    };
    return workflowExecution;
  }
}
