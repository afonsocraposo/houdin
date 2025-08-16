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

  async getWorkflows(): Promise<WorkflowDefinition[]> {
    const storage = this.getStorageAPI();
    console.debug("Getting workflows, storage API available:", !!storage);

    if (!storage) {
      console.debug("Storage API not available, returning empty array");
      return [];
    }

    try {
      let result: any;

      if (storage.isFirefox) {
        // Firefox supports promises
        result = await storage.api.sync.get(["workflows"]);
      } else {
        // Chrome uses callbacks, wrap in promise
        result = await new Promise((resolve, reject) => {
          storage.api.sync.get(["workflows"], (result: any) => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
      }

      console.debug("Retrieved workflows from storage:", result);
      return result.workflows || [];
    } catch (error) {
      console.error("Failed to get workflows:", error);
      return [];
    }
  }

  async saveWorkflows(workflows: WorkflowDefinition[]): Promise<void> {
    return this.saveWorkflowsInternal(workflows, false);
  }

  async saveWorkflowsSilent(workflows: WorkflowDefinition[]): Promise<void> {
    return this.saveWorkflowsInternal(workflows, true);
  }

  private async saveWorkflowsInternal(
    workflows: WorkflowDefinition[],
    silent: boolean = false,
  ): Promise<void> {
    const storage = this.getStorageAPI();
    console.debug("Saving workflows, storage API available:", !!storage);
    console.debug("Workflows to save:", workflows);
    console.debug("Silent save:", silent);

    if (!storage) {
      console.debug("Storage API not available, not saving");
      return;
    }

    try {
      const data = silent
        ? { workflows, _silentSave: Date.now() }
        : { workflows };

      if (storage.isFirefox) {
        // Firefox supports promises
        await storage.api.sync.set(data);
      } else {
        // Chrome uses callbacks, wrap in promise
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

      console.debug("Workflows saved successfully");
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
          // Don't trigger change listener for silent saves
          if (changes._silentSave) {
            console.debug("Silent save detected, skipping change callback");
            return;
          }

          const workflows = changes.workflows?.newValue || [];
          callback(workflows);
        }
      });
    }
  }

  async getCredentials(): Promise<Credential[]> {
    const storage = this.getStorageAPI();
    console.debug("Getting credentials, storage API available:", !!storage);

    if (!storage) {
      console.debug("Storage API not available, returning empty array");
      return [];
    }

    try {
      let result: any;

      if (storage.isFirefox) {
        result = await storage.api.sync.get(["credentials"]);
      } else {
        result = await new Promise((resolve, reject) => {
          storage.api.sync.get(["credentials"], (result: any) => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
      }

      console.debug("Retrieved credentials from storage:", result);
      return result.credentials || [];
    } catch (error) {
      console.error("Failed to get credentials:", error);
      return [];
    }
  }

  async saveCredentials(credentials: Credential[]): Promise<void> {
    const storage = this.getStorageAPI();
    console.debug("Saving credentials, storage API available:", !!storage);
    console.debug(
      "Credentials to save:",
      credentials.map((c) => ({ ...c, value: "[HIDDEN]" })),
    );

    if (!storage) {
      console.debug("Storage API not available, not saving");
      return;
    }

    try {
      if (storage.isFirefox) {
        await storage.api.sync.set({ credentials });
      } else {
        await new Promise<void>((resolve, reject) => {
          storage.api.sync.set({ credentials }, () => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }

      console.debug("Credentials saved successfully");
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

  async getActiveWorkflowExecutions(): Promise<
    Record<string, WorkflowExecution>
  > {
    const storage = this.getStorageAPI();
    if (!storage) return {};

    try {
      let result: any;
      if (storage.isFirefox) {
        result = await storage.api.sync.get(["activeWorkflowExecutions"]);
      } else {
        result = await new Promise((resolve, reject) => {
          storage.api.sync.get(["activeWorkflowExecutions"], (result: any) => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
      }
      return result.workflowExecutions || [];
    } catch (error) {
      console.error("Failed to get workflow executions:", error);
      return {};
    }
  }

  async saveActiveWorkflowExecution(
    workflowExecution: WorkflowExecution,
  ): Promise<void> {
    const storage = this.getStorageAPI();
    if (!storage) return;

    try {
      const executions = await this.getActiveWorkflowExecutions();

      executions[workflowExecution.id] = workflowExecution;

      if (storage.isFirefox) {
        await storage.api.sync.set({ activeWorkflowExecutions: executions });
      } else {
        await new Promise<void>((resolve, reject) => {
          storage.api.sync.set({ activeWorkflowExecutions: executions }, () => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
    } catch (error) {
      console.error("Failed to save active workflow execution:", error);
      throw error;
    }
  }
  async clearActiveWorkflowExecution(executionId: string): Promise<void> {
    const storage = this.getStorageAPI();
    if (!storage) return;
    try {
      const executions = await this.getActiveWorkflowExecutions();

      delete executions[executionId];

      if (storage.isFirefox) {
        await storage.api.sync.set({ activeWorkflowExecutions: executions });
      } else {
        await new Promise<void>((resolve, reject) => {
          storage.api.sync.set({ activeWorkflowExecutions: executions }, () => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }
    } catch (error) {
      console.error("Failed to save active workflow execution:", error);
      throw error;
    }
  }

  // Workflow execution tracking methods
  async getWorkflowExecutions(): Promise<Record<string, WorkflowExecution[]>> {
    const storage = this.getStorageAPI();
    if (!storage) return {};

    try {
      let result: any;
      if (storage.isFirefox) {
        result = await storage.api.sync.get(["workflowExecutions"]);
      } else {
        result = await new Promise((resolve, reject) => {
          storage.api.sync.get(["workflowExecutions"], (result: any) => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });
      }
      return result.workflowExecutions || [];
    } catch (error) {
      console.error("Failed to get workflow executions:", error);
      return {};
    }
  }

  async saveWorkflowExecution(execution: WorkflowExecution): Promise<void> {
    const storage = this.getStorageAPI();
    if (!storage) return;

    try {
      const executions = await this.getWorkflowExecutions();

      // Keep only last 50 executions per workflow to manage storage
      const workflowExecutions =
        executions[execution.workflowId]?.slice(0, 49) || [];

      executions[execution.workflowId] = [...workflowExecutions, execution];

      if (storage.isFirefox) {
        await storage.api.sync.set({ workflowExecutions: executions });
      } else {
        await new Promise<void>((resolve, reject) => {
          storage.api.sync.set({ workflowExecutions: executions }, () => {
            if ((chrome as any)?.runtime?.lastError) {
              reject((chrome as any).runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      }

      // // Update workflow's last execution info
      // const workflows = await this.getWorkflows();
      // const updatedWorkflows = workflows.map((workflow) => {
      //   if (workflow.id === execution.workflowId) {
      //     return {
      //       ...workflow,
      //       lastExecuted: execution.startedAt,
      //       executionCount: (workflow.executionCount || 0) + 1,
      //     };
      //   }
      //   return workflow;
      // });
      //
      // await this.saveWorkflows(updatedWorkflows);
    } catch (error) {
      console.error("Failed to save workflow execution:", error);
      throw error;
    }
  }
}
