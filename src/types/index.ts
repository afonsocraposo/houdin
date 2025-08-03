export interface Recipe {
  id: string
  name: string
  enabled: boolean
  urlPattern: string
  selector: string
  componentType: 'button' | 'input' | 'text'
  componentText: string
  componentStyle: string
  workflowType: 'copy' | 'modal' | 'navigate' | 'custom'
  workflowConfig: {
    sourceSelector?: string
    modalTitle?: string
    modalContent?: string
    navigateUrl?: string
    customScript?: string
  }
}

export interface ExtensionStorage {
  recipes: Recipe[]
}

export interface ComponentInjector {
  recipe: Recipe
  element: HTMLElement
}

export interface WorkflowExecutor {
  recipe: Recipe
  execute: () => void
}