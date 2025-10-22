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
  CLEAN_HTTP_TRIGGERS = "CLEAN_HTTP_TRIGGERS",
  CHECK_READINESS = "CHECK_READINESS",
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

export interface TriggerFiredCommand {
  type: WorkflowCommandType.TRIGGER_FIRED;
  url: string;
  workflowId: string;
  triggerNodeId: string;
  data: any;
  config: Record<string, any>;
  duration: number;
}

export interface CommandResponse {
  commandId: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface StatusMessage {
  success: boolean;
  data?: any;
  error?: string;
  outputHandle?: string;
  config?: Record<string, any>;
}

export interface ReadinessCheckCommand {
  type: WorkflowCommandType.CHECK_READINESS;
  tabId: number;
}

export interface ReadinessResponse {
  ready: boolean;
}

export interface HttpTriggerRegistration {
  workflowId: string;
  triggerNodeId: string;
  urlPattern: string;
  method: string;
}

export interface HttpTriggerFiredMessage {
  workflowId: string;
  triggerNodeId: string;
  data: any;
}
