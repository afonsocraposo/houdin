export interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition";
  position: { x: number; y: number };
  data: any;
  inputs?: string[];
  outputs?: string[];
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// Execution tracking for individual nodes
export interface NodeExecutionResult {
  nodeId: string;
  nodeType: "trigger" | "action" | "condition";
  nodeName: string;
  nodeConfig: any;
  status: "success" | "error";
  data: any;
  executedAt: number;
  duration?: number;
}

export enum WorkflowExecutionStatus {
  WAITING = "waiting",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}
// Workflow execution record
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  triggerType: string;
  startedAt: number;
  completedAt: number | undefined;
  status: WorkflowExecutionStatus;
  nodeResults: NodeExecutionResult[];
  url: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  urlPattern: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  enabled: boolean;
  lastUpdated?: number;
  lastExecuted?: number;
  executionCount?: number;
}

// Workflow execution context for storing action outputs
export interface WorkflowExecutionContext {
  outputs: Record<string, any>;
  setOutput(nodeId: string, value: any): void;
  getOutput(nodeId: string): any;
  interpolateVariables(text: string): string;
}

// Trigger type definitions
export interface NodeData<T = Record<string, any>> {
  type: string;
  config: T;
}

// Helper function to check if a component type can trigger next actions
export function canComponentTriggerActions(componentType: string): boolean {
  return componentType === "button" || componentType === "input";
}

// Helper function to check if a node can have outgoing connections
export function canNodeHaveOutgoingConnections(node: WorkflowNode): boolean {
  if (node.type === "action" && node.data?.actionType === "inject-component") {
    const componentType = node.data?.config?.componentType;
    return canComponentTriggerActions(componentType);
  }
  // All other node types can have outgoing connections
  return true;
}
