export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition'
  position: { x: number; y: number }
  data: any
  inputs?: string[]
  outputs?: string[]
}

export interface WorkflowConnection {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface WorkflowDefinition {
  id: string
  name: string
  description?: string
  urlPattern: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  enabled: boolean
}

// Trigger type definitions
export interface TriggerNodeData {
  triggerType: 'page-load' | 'component-load' | 'delay'
  config: {
    selector?: string // For component-load trigger
    delay?: number // For delay trigger (in milliseconds)
  }
}

// Condition type definitions
export interface ConditionNodeData {
  conditionType: 'element-exists' | 'custom-condition'
  config: {
    selector?: string // For element-exists condition
    customScript?: string // For custom-condition
  }
}

// Action type definitions
export interface ActionNodeData {
  actionType: 'inject-component' | 'copy-content' | 'show-modal' | 'custom-script' | 'navigate' | 'element-click'
  config: {
    // Inject component config
    componentType?: 'button' | 'input' | 'text'
    componentText?: string
    componentStyle?: string
    targetSelector?: string
    
    // Copy content config
    sourceSelector?: string
    
    // Show modal config
    modalTitle?: string
    modalContent?: string
    
    // Custom script config
    customScript?: string
    
    // Navigate config
    navigateUrl?: string
    
    // Element click config
    selector?: string
  }
}

// Node categories for the toolbox
export const NODE_CATEGORIES = {
  triggers: [
    { type: 'page-load', label: 'Page Load', icon: '📄', description: 'Trigger when page finishes loading' },
    { type: 'component-load', label: 'Component Load', icon: '🎯', description: 'Trigger when specific element appears' },
    { type: 'delay', label: 'Delay', icon: '⏰', description: 'Trigger after a delay' }
  ],
  conditions: [
    { type: 'element-exists', label: 'Element Exists', icon: '🎯', description: 'Check if element exists on page' },
    { type: 'custom-condition', label: 'Custom Condition', icon: '⚡', description: 'Custom JavaScript condition' }
  ],
  actions: [
    { type: 'inject-component', label: 'Inject Component', icon: '🔧', description: 'Add button, input, or text to page' },
    { type: 'copy-content', label: 'Copy Content', icon: '📋', description: 'Copy text from page element' },
    { type: 'show-modal', label: 'Show Modal', icon: '💬', description: 'Display modal with content' },
    { type: 'custom-script', label: 'Custom Script', icon: '⚡', description: 'Run custom JavaScript' },
    { type: 'navigate', label: 'Navigate', icon: '🧭', description: 'Navigate to a URL' },
    { type: 'element-click', label: 'Element Click', icon: '👆', description: 'Click on an element' }
  ]
} as const