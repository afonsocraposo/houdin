import { WorkflowDefinition } from "../types/workflow";
import { Credential } from "../types/credentials";
import { WorkflowExecution } from "../types/workflow";

export class StorageManager {
  private static instance: StorageManager;

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private getStorageAPI() {
    // Firefox uses 'browser' namespace, Chrome uses 'chrome'
    if (typeof browser !== "undefined" && (browser as any).storage) {
      return { api: (browser as any).storage, isFirefox: true };
    } else if (typeof chrome !== "undefined" && chrome.storage) {
      return { api: chrome.storage, isFirefox: false };
    }
    console.error("No storage API available");
    return null;
  }

  private async get(key: string): Promise<any> {
    const storage = this.getStorageAPI();
    if (!storage) return null;

    try {
      let result: any;

      if (storage.isFirefox) {
        result = await storage.api.sync.get([key]);
      } else {
        result = await new Promise((resolve, reject) => {
          storage.api.sync.get([key], (result: any) => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
      }

      return result[key] || null;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return null;
    }
  }

  private async set(key: string, value: any): Promise<void> {
    const storage = this.getStorageAPI();
    if (!storage) return;

    try {
      const data = { [key]: value };

      if (storage.isFirefox) {
        await storage.api.sync.set(data);
      } else {
        await new Promise<void>((resolve, reject) => {
          storage.api.sync.set(data, () => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
      throw error;
    }
  }

  private async remove(key: string): Promise<void> {
    const storage = this.getStorageAPI();
    if (!storage) return;

    try {
      if (storage.isFirefox) {
        await storage.api.sync.remove([key]);
      } else {
        await new Promise<void>((resolve, reject) => {
          storage.api.sync.remove([key], () => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
    } catch (error) {
      console.error(`Failed to remove ${key}:`, error);
      throw error;
    }
  }

  async getWorkflows(): Promise<WorkflowDefinition[]> {
    try {
      return (await this.get("workflows")) || [];
    } catch (error) {
      console.error("Failed to get workflows:", error);
      return [];
    }
  }

  async saveWorkflows(workflows: WorkflowDefinition[]): Promise<void> {
    try {
      await this.set("workflows", workflows);
    } catch (error) {
      console.error("Failed to save workflows:", error);
      throw error;
    }
  }

  onStorageChanged(callback: (workflows: WorkflowDefinition[]) => void): void {
    const storage = this.getStorageAPI();
    if (storage) {
      storage.api.onChanged.addListener((changes: any, namespace: string) => {
        if (namespace === "sync" && changes.workflows) {
          const workflows = changes.workflows?.newValue || [];
          callback(workflows);
        }
      });
    }
  }

  async getCredentials(): Promise<Credential[]> {
    try {
      return (await this.get("credentials")) || [];
    } catch (error) {
      console.error("Failed to get credentials:", error);
      return [];
    }
  }

  async saveCredentials(credentials: Credential[]): Promise<void> {
    try {
      await this.set("credentials", credentials);
    } catch (error) {
      console.error("Failed to save credentials:", error);
      throw error;
    }
  }

  // Get credentials filtered by type
  async getCredentialsByType(type: string): Promise<Credential[]> {
    const allCredentials = await this.getCredentials();
    return allCredentials.filter((cred) => cred.type === type);
  }

  onCredentialsChanged(callback: (credentials: Credential[]) => void): void {
    const storage = this.getStorageAPI();
    if (storage) {
      storage.api.onChanged.addListener((changes: any, namespace: string) => {
        if (namespace === "sync" && changes.credentials) {
          const credentials = changes.credentials?.newValue || [];
          callback(credentials);
        }
      });
    }
  }

  // Workflow execution tracking methods
  async getWorkflowExecutions(): Promise<WorkflowExecution[]> {
    try {
      return (await this.get("workflowExecutions")) || [];
    } catch (error) {
      console.error("Failed to get workflow executions:", error);
      return [];
    }
  }

  async saveWorkflowExecution(execution: WorkflowExecution): Promise<void> {
    try {
      const executions = await this.getWorkflowExecutions();

      // Keep only last 50 executions
      const newExecutions = [...(executions?.slice(0, 49) || []), execution];

      await this.set("workflowExecutions", newExecutions);
      console.debug("Workflow execution saved successfully");
    } catch (error) {
      console.error("Failed to save workflow execution:", error);
      throw error;
    }
  }

  async clearWorkflowExecutions(): Promise<void> {
    try {
      await this.remove("workflowExecutions");
      console.debug("All workflow executions cleared successfully");
    } catch (error) {
      console.error("Failed to clear workflow executions:", error);
      throw error;
    }
  }
}
