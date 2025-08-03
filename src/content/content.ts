console.log('Content script loaded')

interface Recipe {
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

let recipes: Recipe[] = []
let injectedComponents: HTMLElement[] = []

// Modal HTML template
const createModal = (title: string, content: string) => {
  const modalHtml = `
    <div id="changeme-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e0e0e0;
        ">
          <h2 style="margin: 0; font-size: 18px; font-weight: 600;">${title}</h2>
          <button id="changeme-modal-close" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
            color: #666;
          ">&times;</button>
        </div>
        <div style="
          line-height: 1.6;
          color: #333;
          white-space: pre-wrap;
          max-height: 400px;
          overflow-y: auto;
        ">${content}</div>
      </div>
    </div>
  `
  
  const modalElement = document.createElement('div')
  modalElement.innerHTML = modalHtml
  document.body.appendChild(modalElement)
  
  // Close modal handlers
  const closeModal = () => {
    document.body.removeChild(modalElement)
  }
  
  modalElement.querySelector('#changeme-modal-close')?.addEventListener('click', closeModal)
  modalElement.querySelector('#changeme-modal')?.addEventListener('click', (e) => {
    if (e.target === modalElement.querySelector('#changeme-modal')) {
      closeModal()
    }
  })
  
  // Close on Escape key
  const escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal()
      document.removeEventListener('keydown', escapeHandler)
    }
  }
  document.addEventListener('keydown', escapeHandler)
}

const executeWorkflow = (recipe: Recipe) => {
  console.log('Executing workflow:', recipe.name)
  
  try {
    switch (recipe.workflowType) {
      case 'copy': {
        if (recipe.workflowConfig.sourceSelector) {
          const sourceElement = document.querySelector(recipe.workflowConfig.sourceSelector)
          if (sourceElement) {
            const textContent = sourceElement.textContent || ''
            navigator.clipboard.writeText(textContent).then(() => {
              console.log('Content copied to clipboard')
              // Show a brief notification
              const notification = document.createElement('div')
              notification.textContent = 'Content copied to clipboard!'
              notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #28a745;
                color: white;
                padding: 12px 16px;
                border-radius: 4px;
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              `
              document.body.appendChild(notification)
              setTimeout(() => {
                document.body.removeChild(notification)
              }, 3000)
            })
          }
        }
        break
      }
      
      case 'modal': {
        let modalContent = recipe.workflowConfig.modalContent || ''
        
        if (recipe.workflowConfig.sourceSelector) {
          const sourceElement = document.querySelector(recipe.workflowConfig.sourceSelector)
          if (sourceElement) {
            const textContent = sourceElement.textContent || ''
            modalContent += '\n\n' + textContent
          }
        }
        
        createModal(
          recipe.workflowConfig.modalTitle || 'Workflow Result',
          modalContent
        )
        break
      }
      
      case 'navigate': {
        if (recipe.workflowConfig.navigateUrl) {
          window.location.href = recipe.workflowConfig.navigateUrl
        }
        break
      }
      
      case 'custom': {
        if (recipe.workflowConfig.customScript) {
          // Execute custom JavaScript
          const func = new Function(recipe.workflowConfig.customScript)
          func()
        }
        break
      }
    }
  } catch (error) {
    console.error('Error executing workflow:', error)
  }
}

const createComponent = (recipe: Recipe): HTMLElement => {
  let element: HTMLElement
  
  switch (recipe.componentType) {
    case 'button':
      element = document.createElement('button')
      element.textContent = recipe.componentText
      element.addEventListener('click', () => executeWorkflow(recipe))
      break
      
    case 'input':
      element = document.createElement('input')
      const input = element as HTMLInputElement
      input.type = 'text'
      input.placeholder = recipe.componentText
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          executeWorkflow(recipe)
        }
      })
      break
      
    case 'text':
      element = document.createElement('span')
      element.textContent = recipe.componentText
      element.addEventListener('click', () => executeWorkflow(recipe))
      element.style.cursor = 'pointer'
      break
      
    default:
      element = document.createElement('div')
      element.textContent = recipe.componentText
  }
  
  // Apply custom styles
  if (recipe.componentStyle) {
    element.style.cssText = recipe.componentStyle
  }
  
  // Add data attribute for identification
  element.setAttribute('data-changeme-recipe', recipe.id)
  
  return element
}

const matchesUrlPattern = (pattern: string, url: string): boolean => {
  // Convert simple wildcard pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(url)
}

const injectComponents = () => {
  // Remove previously injected components
  injectedComponents.forEach(component => {
    if (component.parentNode) {
      component.parentNode.removeChild(component)
    }
  })
  injectedComponents = []
  
  const currentUrl = window.location.href
  
  // Find matching recipes for current URL
  const matchingRecipes = recipes.filter(recipe => 
    recipe.enabled && matchesUrlPattern(recipe.urlPattern, currentUrl)
  )
  
  console.log(`Found ${matchingRecipes.length} matching recipes for ${currentUrl}`)
  
  matchingRecipes.forEach(recipe => {
    const targetElement = document.querySelector(recipe.selector)
    if (targetElement) {
      const component = createComponent(recipe)
      targetElement.appendChild(component)
      injectedComponents.push(component)
      console.log(`Injected component for recipe: ${recipe.name}`)
    } else {
      console.warn(`Target element not found for recipe: ${recipe.name} (selector: ${recipe.selector})`)
    }
  })
}

const loadRecipes = () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['recipes'], (result) => {
      if (result.recipes) {
        recipes = result.recipes
        console.log('Loaded recipes:', recipes.length)
        injectComponents()
      }
    })
  }
}

const initContentScript = () => {
  console.log('changeme extension content script initialized')
  loadRecipes()
  
  // Listen for storage changes (when recipes are updated in config)
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.recipes) {
        console.log('Recipes updated, reloading...')
        loadRecipes()
      }
    })
  }
  
  // Re-inject components when page content changes (for SPAs)
  const observer = new MutationObserver((mutations) => {
    let shouldReinject = false
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldReinject = true
      }
    })
    
    if (shouldReinject) {
      setTimeout(injectComponents, 1000) // Delay to allow content to settle
    }
  })
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript)
} else {
  initContentScript()
}

// Also listen for URL changes in SPAs
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    console.log('URL changed, reinjecting components')
    setTimeout(injectComponents, 1000)
  }
}).observe(document, { subtree: true, childList: true })