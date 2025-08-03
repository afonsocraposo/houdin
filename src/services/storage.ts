import { WorkflowDefinition } from '../types/workflow'

export class StorageManager {
  private static instance: StorageManager
  
  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  private getStorageAPI() {
    // Firefox uses 'browser' namespace, Chrome uses 'chrome'
    if (typeof browser !== 'undefined' && (browser as any).storage) {
      console.log('Using browser.storage API (Firefox)')
      return { api: (browser as any).storage, isFirefox: true }
    } else if (typeof chrome !== 'undefined' && chrome.storage) {
      console.log('Using chrome.storage API (Chrome)')
      return { api: chrome.storage, isFirefox: false }
    }
    console.error('No storage API available')
    return null
  }

  async getWorkflows(): Promise<WorkflowDefinition[]> {
    const storage = this.getStorageAPI()
    console.log('Getting workflows, storage API available:', !!storage)
    
    if (!storage) {
      console.log('Storage API not available, returning empty array')
      return []
    }

    try {
      let result: any
      
      if (storage.isFirefox) {
        // Firefox supports promises
        result = await storage.api.sync.get(['workflows'])
      } else {
        // Chrome uses callbacks, wrap in promise
        result = await new Promise((resolve, reject) => {
          storage.api.sync.get(['workflows'], (result: any) => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError)
            } else {
              resolve(result)
            }
          })
        })
      }
      
      console.log('Retrieved workflows from storage:', result)
      return result.workflows || []
    } catch (error) {
      console.error('Failed to get workflows:', error)
      return []
    }
  }

  async saveWorkflows(workflows: WorkflowDefinition[]): Promise<void> {
    const storage = this.getStorageAPI()
    console.log('Saving workflows, storage API available:', !!storage)
    console.log('Workflows to save:', workflows)
    
    if (!storage) {
      console.log('Storage API not available, not saving')
      return
    }

    try {
      if (storage.isFirefox) {
        // Firefox supports promises
        await storage.api.sync.set({ workflows })
      } else {
        // Chrome uses callbacks, wrap in promise
        await new Promise<void>((resolve, reject) => {
          storage.api.sync.set({ workflows }, () => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError)
            } else {
              resolve()
            }
          })
        })
      }
      
      console.log('Workflows saved successfully')
    } catch (error) {
      console.error('Failed to save workflows:', error)
      throw error
    }
  }

  onStorageChanged(callback: (workflows: WorkflowDefinition[]) => void): void {
    const storage = this.getStorageAPI()
    if (storage) {
      storage.api.onChanged.addListener((changes: any, namespace: string) => {
        if (namespace === 'sync' && changes.workflows) {
          const workflows = changes.workflows?.newValue || []
          callback(workflows)
        }
      })
    }
  }
}