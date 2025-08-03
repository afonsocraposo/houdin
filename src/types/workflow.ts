export interface WorkflowNode {
  id: string
  type: 'trigger' | 'action' | 'condition'
  position: { x: number; y: number }
  data: any
  inputs: string[]
  outputs: string[]
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
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  enabled: boolean
}

// Node type definitions
export interface TriggerNodeData {
  triggerType: 'url-match' | 'element-click' | 'page-load' | 'storage-change'
  config: {
    urlPattern?: string
    selector?: string
    event?: string
  }
}

export interface ActionNodeData {
  actionType: 'inject-component' | 'copy-content' | 'show-modal' | 'navigate' | 'custom-script'
  config: {
    componentType?: 'button' | 'input' | 'text'
    componentText?: string
    componentStyle?: string
    selector?: string
    sourceSelector?: string
    modalTitle?: string
    modalContent?: string
    navigateUrl?: string
    customScript?: string
  }
}

export interface ConditionNodeData {
  conditionType: 'element-exists' | 'text-contains' | 'url-contains' | 'custom'
  config: {
    selector?: string
    text?: string
    url?: string
    customCondition?: string
  }
}

// Node categories for the toolbox
export const NODE_CATEGORIES = {
  triggers: [
    { type: 'url-match', label: 'URL Pattern', icon: '🌐', description: 'Trigger when URL matches pattern' },
    { type: 'page-load', label: 'Page Load', icon: '📄', description: 'Trigger when page loads' },
    { type: 'element-click', label: 'Element Click', icon: '👆', description: 'Trigger when element is clicked' }
  ],
  actions: [
    { type: 'inject-component', label: 'Inject Component', icon: '🔧', description: 'Add button, input, or text to page' },
    { type: 'copy-content', label: 'Copy Content', icon: '📋', description: 'Copy text from page element' },
    { type: 'show-modal', label: 'Show Modal', icon: '💬', description: 'Display modal with content' },
    { type: 'navigate', label: 'Navigate', icon: '🔗', description: 'Navigate to URL' },
    { type: 'custom-script', label: 'Custom Script', icon: '⚡', description: 'Run custom JavaScript' }
  ],
  conditions: [
    { type: 'element-exists', label: 'Element Exists', icon: '🔍', description: 'Check if element exists' },
    { type: 'text-contains', label: 'Text Contains', icon: '📝', description: 'Check if text contains value' },
    { type: 'url-contains', label: 'URL Contains', icon: '🌐', description: 'Check if URL contains value' }
  ]
} as const