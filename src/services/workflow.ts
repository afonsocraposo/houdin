import { WorkflowDefinition, WorkflowNode, ActionNodeData, TriggerNodeData } from '../types/workflow'
import { copyToClipboard, showNotification } from '../utils/helpers'
import { createModal } from '../components/Modal'

export class WorkflowExecutor {
  private observerTimeouts: Map<string, number> = new Map()
  private delayTimeouts: Map<string, number> = new Map()

  constructor(private workflow: WorkflowDefinition) {}

  async execute(): Promise<void> {
    console.log('Executing workflow:', this.workflow.name)
    
    if (!this.workflow.enabled) {
      console.log('Workflow is disabled, skipping execution')
      return
    }

    try {
      // Find trigger nodes and set them up
      const triggerNodes = this.workflow.nodes.filter(node => node.type === 'trigger')
      
      for (const triggerNode of triggerNodes) {
        await this.setupTrigger(triggerNode)
      }
    } catch (error) {
      console.error('Error executing workflow:', error)
      showNotification(`Error executing ${this.workflow.name}`, 'error')
    }
  }

  private async setupTrigger(node: WorkflowNode): Promise<void> {
    const triggerData = node.data as TriggerNodeData
    
    switch (triggerData.triggerType) {
      case 'page-load':
        // Page is already loaded when this is called, so trigger immediately
        await this.executeConnectedActions(node)
        break
      
      case 'component-load':
        if (triggerData.config.selector) {
          await this.setupComponentLoadTrigger(node, triggerData.config.selector)
        }
        break
      
      case 'delay':
        if (triggerData.config.delay) {
          await this.setupDelayTrigger(node, triggerData.config.delay)
        }
        break
    }
  }

  private async setupComponentLoadTrigger(node: WorkflowNode, selector: string): Promise<void> {
    // Check if element already exists
    const existingElement = document.querySelector(selector)
    if (existingElement) {
      await this.executeConnectedActions(node)
      return
    }

    // Set up observer to watch for element
    const observer = new MutationObserver(async (mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const element = document.querySelector(selector)
          if (element) {
            observer.disconnect()
            await this.executeConnectedActions(node)
            return
          }
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Clean up after 30 seconds to prevent memory leaks
    const timeoutId = window.setTimeout(() => {
      observer.disconnect()
      console.log(`Component load trigger timed out for selector: ${selector}`)
    }, 30000)

    this.observerTimeouts.set(node.id, timeoutId)
  }

  private async setupDelayTrigger(node: WorkflowNode, delay: number): Promise<void> {
    const timeoutId = window.setTimeout(async () => {
      await this.executeConnectedActions(node)
      this.delayTimeouts.delete(node.id)
    }, delay)

    this.delayTimeouts.set(node.id, timeoutId)
  }

  private async executeConnectedActions(triggerNode: WorkflowNode): Promise<void> {
    // Find all actions connected to this trigger
    const connections = this.workflow.connections.filter(conn => conn.source === triggerNode.id)
    
    for (const connection of connections) {
      const actionNode = this.workflow.nodes.find(n => n.id === connection.target)
      if (actionNode && actionNode.type === 'action') {
        await this.executeAction(actionNode)
      }
    }
  }

  private async executeAction(node: WorkflowNode): Promise<void> {
    const actionData = node.data as ActionNodeData
    
    switch (actionData.actionType) {
      case 'inject-component':
        await this.executeInjectComponent(actionData)
        break
      case 'copy-content':
        await this.executeCopyContent(actionData)
        break
      case 'show-modal':
        await this.executeShowModal(actionData)
        break
      case 'custom-script':
        await this.executeCustomScript(actionData)
        break
    }
  }

  private async executeInjectComponent(actionData: ActionNodeData): Promise<void> {
    const targetElement = document.querySelector(actionData.config.targetSelector || 'body')
    if (!targetElement) {
      showNotification('Target element not found for component injection', 'error')
      return
    }

    let component: HTMLElement
    
    switch (actionData.config.componentType) {
      case 'button':
        component = document.createElement('button')
        component.textContent = actionData.config.componentText || 'Button'
        component.addEventListener('click', () => {
          showNotification('Button clicked!')
        })
        break
      case 'input':
        component = document.createElement('input')
        component.setAttribute('placeholder', actionData.config.componentText || 'Input')
        break
      case 'text':
        component = document.createElement('span')
        component.textContent = actionData.config.componentText || 'Text'
        break
      default:
        component = document.createElement('div')
        component.textContent = actionData.config.componentText || 'Component'
    }

    if (actionData.config.componentStyle) {
      component.style.cssText = actionData.config.componentStyle
    }

    component.setAttribute('data-workflow-injected', 'true')
    component.setAttribute('data-workflow-id', this.workflow.id)
    targetElement.appendChild(component)
    showNotification('Component injected successfully!')
  }

  private async executeCopyContent(actionData: ActionNodeData): Promise<void> {
    const sourceElement = document.querySelector(actionData.config.sourceSelector || '')
    if (sourceElement) {
      const textContent = sourceElement.textContent || ''
      await copyToClipboard(textContent)
      showNotification('Content copied to clipboard!')
    } else {
      showNotification('Source element not found', 'error')
    }
  }

  private async executeShowModal(actionData: ActionNodeData): Promise<void> {
    let modalContent = actionData.config.modalContent || ''
    
    if (actionData.config.sourceSelector) {
      const sourceElement = document.querySelector(actionData.config.sourceSelector)
      if (sourceElement) {
        const textContent = sourceElement.textContent || ''
        modalContent += '\n\n' + textContent
      }
    }
    
    createModal(
      actionData.config.modalTitle || 'Workflow Result',
      modalContent
    )
  }

  private async executeCustomScript(actionData: ActionNodeData): Promise<void> {
    if (actionData.config.customScript) {
      try {
        const func = new Function(actionData.config.customScript)
        func()
      } catch (error) {
        console.error('Error executing custom script:', error)
        showNotification('Error executing custom script', 'error')
      }
    }
  }

  destroy(): void {
    // Clean up any active timeouts and observers
    this.observerTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId)
    })
    this.observerTimeouts.clear()

    this.delayTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId)
    })
    this.delayTimeouts.clear()
  }
}