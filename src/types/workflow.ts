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
export interface TriggerNodeData {
  triggerType: "page-load" | "component-load" | "delay";
  config: {
    selector?: string; // For component-load trigger
    delay?: number; // For delay trigger (in milliseconds)
  };
}

// Condition type definitions
export interface ConditionNodeData {
  conditionType: "element-exists" | "custom-condition";
  config: {
    selector?: string; // For element-exists condition
    customScript?: string; // For custom-condition
  };
}

// Action type definitions
export interface ActionNodeData {
  actionType:
    | "inject-component"
    | "copy-content"
    | "show-modal"
    | "custom-script"
    | "navigate"
    | "element-click"
    | "get-element-content"
    | "llm-openai";
  config: {
    // Inject component config
    componentType?: "button" | "input" | "text";
    componentText?: string;
    componentStyle?: string;
    targetSelector?: string;

    // Copy content config
    sourceSelector?: string;

    // Show modal config
    modalTitle?: string;
    modalContent?: string;

    // Custom script config
    customScript?: string;

    // Navigate config
    navigateUrl?: string;

    // Element click config
    selector?: string;

    // Get element content config
    elementSelector?: string;

    // LLM OpenAI config
    credentialId?: string;
    prompt?: string;
    model?: "gpt-3.5-turbo" | "gpt-4" | "gpt-4-turbo" | "gpt-4o";
    maxTokens?: number;
    temperature?: number;
  };
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
