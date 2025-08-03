import { Recipe } from '../types'
import { copyToClipboard, showNotification } from '../utils/helpers'
import { createModal } from '../components/Modal'

export class WorkflowExecutor {
  constructor(private recipe: Recipe) {}

  async execute(): Promise<void> {
    console.log('Executing workflow:', this.recipe.name)
    
    try {
      switch (this.recipe.workflowType) {
        case 'copy':
          await this.executeCopyWorkflow()
          break
        case 'modal':
          await this.executeModalWorkflow()
          break
        case 'navigate':
          await this.executeNavigateWorkflow()
          break
        case 'custom':
          await this.executeCustomWorkflow()
          break
        default:
          console.warn('Unknown workflow type:', this.recipe.workflowType)
      }
    } catch (error) {
      console.error('Error executing workflow:', error)
      showNotification(`Error executing ${this.recipe.name}`, 'error')
    }
  }

  private async executeCopyWorkflow(): Promise<void> {
    if (this.recipe.workflowConfig.sourceSelector) {
      const sourceElement = document.querySelector(this.recipe.workflowConfig.sourceSelector)
      if (sourceElement) {
        const textContent = sourceElement.textContent || ''
        await copyToClipboard(textContent)
        showNotification('Content copied to clipboard!')
      } else {
        showNotification('Source element not found', 'error')
      }
    }
  }

  private async executeModalWorkflow(): Promise<void> {
    let modalContent = this.recipe.workflowConfig.modalContent || ''
    
    if (this.recipe.workflowConfig.sourceSelector) {
      const sourceElement = document.querySelector(this.recipe.workflowConfig.sourceSelector)
      if (sourceElement) {
        const textContent = sourceElement.textContent || ''
        modalContent += '\n\n' + textContent
      }
    }
    
    createModal(
      this.recipe.workflowConfig.modalTitle || 'Workflow Result',
      modalContent
    )
  }

  private async executeNavigateWorkflow(): Promise<void> {
    if (this.recipe.workflowConfig.navigateUrl) {
      window.location.href = this.recipe.workflowConfig.navigateUrl
    }
  }

  private async executeCustomWorkflow(): Promise<void> {
    if (this.recipe.workflowConfig.customScript) {
      const func = new Function(this.recipe.workflowConfig.customScript)
      func()
    }
  }
}