import { Recipe } from '../types'
import { matchesUrlPattern } from '../utils/helpers'
import { StorageManager } from '../services/storage'
import { ComponentFactory } from '../components/ComponentFactory'

export class ContentInjector {
  private recipes: Recipe[] = []
  private injectedComponents: HTMLElement[] = []
  private storageManager: StorageManager
  private observer: MutationObserver | null = null
  private urlObserver: MutationObserver | null = null
  private lastUrl: string = location.href
  private injectionTimeout: number | null = null
  private isInjecting: boolean = false

  constructor() {
    this.storageManager = StorageManager.getInstance()
    this.setupUrlChangeListener()
  }

  async initialize(): Promise<void> {
    console.log('Content injector initialized')
    await this.loadRecipes()
    this.setupStorageListener()
    this.injectComponents()
  }

  private async loadRecipes(): Promise<void> {
    this.recipes = await this.storageManager.getRecipes()
    console.log('Loaded recipes:', this.recipes.length)
  }

  private setupStorageListener(): void {
    this.storageManager.onStorageChanged((recipes) => {
      console.log('Recipes updated, reloading...')
      this.recipes = recipes
      this.injectComponents()
    })
  }

  // Temporarily disabled to prevent duplicate injections
  // private setupMutationObserver(): void {
  //   this.observer = new MutationObserver((mutations) => {
  //     let shouldReinject = false
  //     mutations.forEach(mutation => {
  //       if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
  //         // Only reinject if significant DOM changes happened (not our own changes)
  //         const hasSignificantChanges = Array.from(mutation.addedNodes).some(node => 
  //           node.nodeType === Node.ELEMENT_NODE && 
  //           !(node as Element).hasAttribute('data-changeme-injected')
  //         )
  //         if (hasSignificantChanges) {
  //           shouldReinject = true
  //         }
  //       }
  //     })
      
  //     if (shouldReinject) {
  //       this.scheduleInjection()
  //     }
  //   })
    
  //   this.observer.observe(document.body, {
  //     childList: true,
  //     subtree: true
  //   })
  // }

  private setupUrlChangeListener(): void {
    this.urlObserver = new MutationObserver(() => {
      const url = location.href
      if (url !== this.lastUrl) {
        this.lastUrl = url
        console.log('URL changed, reinjecting components')
        this.scheduleInjection()
      }
    })
    this.urlObserver.observe(document, { subtree: true, childList: true })
  }

  private scheduleInjection(): void {
    // Debounce injection calls with longer delay
    if (this.injectionTimeout) {
      clearTimeout(this.injectionTimeout)
    }
    
    this.injectionTimeout = window.setTimeout(() => {
      if (!this.isInjecting) {
        this.injectComponents()
      }
    }, 2000) // Increased from 1000ms to 2000ms
  }

  private removeInjectedComponents(): void {
    // Remove components we created
    this.injectedComponents.forEach(component => {
      if (component.parentNode) {
        component.parentNode.removeChild(component)
      }
    })
    this.injectedComponents = []
    
    // Also remove any components with our data attribute (in case we missed some)
    const existingComponents = document.querySelectorAll('[data-changeme-recipe]')
    existingComponents.forEach(component => {
      if (component.parentNode) {
        component.parentNode.removeChild(component)
      }
    })
  }

  private injectComponents(): void {
    if (this.isInjecting) return
    this.isInjecting = true
    
    // Clear injection timeout
    if (this.injectionTimeout) {
      clearTimeout(this.injectionTimeout)
      this.injectionTimeout = null
    }
    
    this.removeInjectedComponents()
    
    const currentUrl = window.location.href
    const matchingRecipes = this.recipes.filter(recipe => 
      recipe.enabled && matchesUrlPattern(recipe.urlPattern, currentUrl)
    )
    
    if (matchingRecipes.length > 0) {
      console.log(`Found ${matchingRecipes.length} matching recipes for ${currentUrl}`)
    }
    
    matchingRecipes.forEach(recipe => {
      const targetElement = document.querySelector(recipe.selector)
      if (targetElement) {
        const component = ComponentFactory.create(recipe)
        component.setAttribute('data-changeme-recipe', recipe.id)
        component.setAttribute('data-changeme-injected', 'true')
        targetElement.appendChild(component)
        this.injectedComponents.push(component)
        console.log(`Injected component for recipe: ${recipe.name}`)
      } else {
        console.warn(`Target element not found for recipe: ${recipe.name} (selector: ${recipe.selector})`)
      }
    })
    
    this.isInjecting = false
  }

  destroy(): void {
    this.removeInjectedComponents()
    if (this.observer) {
      this.observer.disconnect()
    }
    if (this.urlObserver) {
      this.urlObserver.disconnect()
    }
    if (this.injectionTimeout) {
      clearTimeout(this.injectionTimeout)
    }
  }
}