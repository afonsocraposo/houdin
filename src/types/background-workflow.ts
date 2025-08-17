// Background workflow exceution engine
export interface BackgroundWorkflowEngine {
  executeWorkflow(workflowId: string): Promise<void>;
  stopWorkflow(workflowId: string): void;
  getActiveWorkflows(): ActiveWorkflow[];
}

// Active workflow tracking
export interface ActiveWorkflow {
  workflowId: string;
  executionId: string;
  currentTabId: number;
  variables: Record<string, any>;
  startedAt: number;
}

export enum WorkflowCommandType {
  EXECUTE_ACTION = "EXECUTE_ACTION",
  INIT_TRIGGER = "INIT_TRIGGER",
  TRIGGER_FIRED = "TRIGGER_FIRED",
}

// Command system for content scripts
export interface WorkflowCommand {
  type: WorkflowCommandType;
  executionId?: string;
  workflowId: string;
  tabId: number;
  nodeType: string;
  nodeConfig: any;
  nodeId: string;
}

export interface ActionCommand extends WorkflowCommand {
  type: WorkflowCommandType.EXECUTE_ACTION;
}

export interface TriggerCommand extends WorkflowCommand {
  type: WorkflowCommandType.INIT_TRIGGER;
}

export interface CommandResponse {
  commandId: string;
  success: boolean;
  data?: any;
  error?: string;
}
