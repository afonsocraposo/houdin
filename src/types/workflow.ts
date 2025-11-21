import { newExecutionId, newWorkflowId } from "@/utils/helpers";

export type NodeType = "trigger" | "action";
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: TriggerNodeData | ActionNodeData | BaseNodeData;
  inputs?: string[];
  outputs?: string[];
}

interface BaseNodeData {
  config: Record<string, any>;
}
export interface TriggerNodeData extends BaseNodeData {
  type: string;
}
export interface ActionNodeData extends BaseNodeData {
  type: string;
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
  nodeType: NodeType;
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
  variables?: Record<string, string>;
  modifiedAt?: number;
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

export interface WorkflowExecutionStats {
  total: number;
  successful: number;
  failed: number;
}

export interface ExecutionMetadata {
  workflowId: string;
  executionId: string;
  url: string;
  startedAt: number;
}
export const ExecutionMetadataKeys = [
  "executionId",
  "startedAt",
  "url",
  "workflowId",
] as const;
export const ExecutionMetadataExamples = {
  workflowId: newWorkflowId(),
  executionId: newExecutionId(),
  url: "https://example.com",
  startedAt: Date.now(),
};
