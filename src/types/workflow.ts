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

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  urlPattern: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  enabled: boolean;
  lastUpdated?: number;
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
