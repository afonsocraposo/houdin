import { Recipe } from '../types'
import { WorkflowExecutor } from '../services/workflow'

export class ComponentFactory {
  static create(recipe: Recipe): HTMLElement {
    let element: HTMLElement
    
    switch (recipe.componentType) {
      case 'button':
        element = this.createButton(recipe)
        break
      case 'input':
        element = this.createInput(recipe)
        break
      case 'text':
        element = this.createText(recipe)
        break
      default:
        element = this.createDefault(recipe)
    }
    
    // Apply custom styles
    if (recipe.componentStyle) {
      element.style.cssText = recipe.componentStyle
    }
    
    // Add data attribute for identification
    element.setAttribute('data-changeme-recipe', recipe.id)
    
    return element
  }

  private static createButton(recipe: Recipe): HTMLElement {
    const button = document.createElement('button')
    button.textContent = recipe.componentText
    button.addEventListener('click', () => {
      const executor = new WorkflowExecutor(recipe)
      executor.execute()
    })
    return button
  }

  private static createInput(recipe: Recipe): HTMLElement {
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = recipe.componentText
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const executor = new WorkflowExecutor(recipe)
        executor.execute()
      }
    })
    return input
  }

  private static createText(recipe: Recipe): HTMLElement {
    const span = document.createElement('span')
    span.textContent = recipe.componentText
    span.style.cursor = 'pointer'
    span.addEventListener('click', () => {
      const executor = new WorkflowExecutor(recipe)
      executor.execute()
    })
    return span
  }

  private static createDefault(recipe: Recipe): HTMLElement {
    const div = document.createElement('div')
    div.textContent = recipe.componentText
    return div
  }
}