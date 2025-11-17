import { WorkflowDefinition, WorkflowExecutionStats } from "@/types/workflow";
import type { Credential } from "@/types/credentials";
import { WorkflowExecution } from "@/types/workflow";
import { StorageAction } from "@/types/storage";
import { StorageKeys } from "./storage-keys";
import browser from "./browser";
import type { Runtime } from "webextension-polyfill";
import { sendMessageToBackground } from "@/lib/messages";

export const MAX_EXECUTIONS_HISTORY = 50; // Limit for workflow executions

interface getWorkflowExecutionsOptions {
  limit?: number;
  reverse?: boolean;
}

export class StorageServer {
  private static instance: StorageServer | null = null;
  private subscribers: Map<string, Set<Runtime.Port>> = new Map();
  private portConnections: Set<Runtime.Port> = new Set();
  private localListeners: Map<string, Set<(value: any) => void>> = new Map();

  private constructor() {
    // Handle long-lived connections for listeners
    browser.runtime.onConnect.addListener((port: Runtime.Port) => {
      if (port.name === "storage-listener") {
        this.portConnections.add(port);

        port.onDisconnect.addListener(() => {
          this.portConnections.delete(port);
          // Remove port from all subscriptions
          this.subscribers.forEach((ports) => ports.delete(port));
        });

        port.onMessage.addListener((message: any) => {
          switch (message.type) {
            case StorageAction.SUBSCRIBE:
              this.subscribe(port, message.key);
              break;
            case StorageAction.UNSUBSCRIBE:
              this.unsubscribe(port, message.key);
              break;
          }
        });
      }
    });

    browser.runtime.onMessage.addListener((message: any, _sender: any) => {
      const { data } = message;
      switch (message.type) {
        case StorageAction.GET:
          try {
            return this.get(data.key).then((value) => {
              return Promise.resolve({ success: true, value });
            });
          } catch (error: any) {
            return Promise.resolve({ success: false, error: error.message });
          }
        case StorageAction.SET:
          return this.set(data.key, data.value)
            .then(() => {
              this.notifySubscribers(data.key, data.value);
              this.notifyLocalListeners(data.key, data.value);
              return Promise.resolve({ success: true });
            })
            .catch((error: any) => {
              return Promise.resolve({ success: false, error: error.message });
            });
        case StorageAction.REMOVE:
          return this.remove(data.key)
            .then(() => {
              this.notifySubscribers(data.key, null);
              this.notifyLocalListeners(data.key, null);
              return Promise.resolve({ success: true });
            })
            .catch((error: any) => {
              return Promise.resolve({ success: false, error: error.message });
            });
        case "PING":
          return Promise.resolve({ success: true });
      }
    });
  }

  static getInstance(): StorageServer {
    if (!StorageServer.instance) {
      StorageServer.instance = new StorageServer();
      StorageServer.instance.remove(
        StorageKeys.SESSION_WORKFLOW_EXECUTION_STATS,
      );
    }
    return StorageServer.instance;
  }

  private subscribe(port: Runtime.Port, key: string) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(port);
  }

  private unsubscribe(port: Runtime.Port, key: string) {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.delete(port);
      if (subscribers.size === 0) {
        this.subscribers.delete(key);
      }
    }
  }

  private notifySubscribers(key: string, value: any) {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      const message = {
        type: StorageAction.CHANGE_NOTIFICATION,
        key,
        value,
      };

      subscribers.forEach((port) => {
        try {
          port.postMessage(message);
        } catch (error) {
          // Port might be disconnected, remove it
          subscribers.delete(port);
        }
      });
    }
  }

  private notifyLocalListeners(key: string, value: any) {
    const callbacks = this.localListeners.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          console.error(
            `Error in local storage listener callback for key ${key}:`,
            error,
          );
        }
      });
    }
  }

  // Generic storage methods - only these should be public
  public async get(key: string): Promise<any> {
    const result = await browser.storage.local.get([key]);
    return result[key] || null;
  }

  public async set(key: string, value: any): Promise<void> {
    const data = { [key]: value };
    await browser.storage.local.set(data);

    // Notify listeners after successful set
    this.notifySubscribers(key, value);
    this.notifyLocalListeners(key, value);
  }

  public async remove(key: string): Promise<void> {
    await browser.storage.local.remove([key]);

    // Notify listeners after successful removal
    this.notifySubscribers(key, null);
    this.notifyLocalListeners(key, null);
  }

  public addListener(key: string, callback: (value: any) => void): () => void {
    if (!this.localListeners.has(key)) {
      this.localListeners.set(key, new Set());
    }

    this.localListeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.localListeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.localListeners.delete(key);
        }
      }
    };
  }
}

// Interface for storage operations
interface IStorageClient {
  getWorkflows(): Promise<WorkflowDefinition[]>;
  saveWorkflows(workflows: WorkflowDefinition[]): Promise<void>;
  getCredentials(): Promise<Credential[]>;
  saveCredentials(credentials: Credential[]): Promise<void>;
  getCredentialsByType(type: string): Promise<Credential[]>;
  getWorkflowExecutions(): Promise<WorkflowExecution[]>;
  saveWorkflowExecutions(executions: WorkflowExecution[]): Promise<void>;
  saveWorkflowExecution(execution: WorkflowExecution): Promise<void>;
  clearWorkflowExecutions(): Promise<void>;
  addWorkflowsListener(
    callback: (workflows: WorkflowDefinition[]) => void,
  ): () => void;
  addCredentialsListener(
    callback: (credentials: Credential[]) => void,
  ): () => void;
  addWorkflowExecutionsListener(
    callback: (executions: WorkflowExecution[]) => void,
  ): () => void;
}

// Base class with shared business logic
abstract class StorageClientBase implements IStorageClient {
  // Abstract methods that subclasses must implement
  protected abstract get(key: string): Promise<any>;
  protected abstract set(key: string, value: any): Promise<void>;
  protected abstract remove(key: string): Promise<void>;
  public abstract addListener(
    key: string,
    callback: (value: any) => void,
  ): () => void;

  // Shared business logic methods
  async getWorkflows(): Promise<WorkflowDefinition[]> {
    try {
      return (await this.get(StorageKeys.WORKFLOWS)) || [];
    } catch (error) {
      console.error("Failed to get workflows:", error);
      return [];
    }
  }

  async saveWorkflows(workflows: WorkflowDefinition[]): Promise<void> {
    try {
      await this.set(StorageKeys.WORKFLOWS, workflows);
    } catch (error) {
      console.error("Failed to save workflows:", error);
      throw error;
    }
  }

  async createWorkflow(workflow: WorkflowDefinition): Promise<void> {
    const workflows = await this.getWorkflows();
    const exists = workflows.some((w) => w.id === workflow.id);
    if (exists) {
      throw new Error(`Workflow with id ${workflow.id} already exists`);
    }
    workflows.push(workflow);
    await this.saveWorkflows(workflows);
  }

  async updateWorkflow(workflow: WorkflowDefinition): Promise<void> {
    const workflows = await this.getWorkflows();
    const index = workflows.findIndex((w) => w.id === workflow.id);
    if (index === -1) {
      throw new Error(`Workflow with id ${workflow.id} does not exist`);
    }
    workflows[index] = workflow;
    await this.saveWorkflows(workflows);
  }

  async getCredentials(): Promise<Credential[]> {
    try {
      return (await this.get(StorageKeys.CREDENTIALS)) || [];
    } catch (error) {
      console.error("Failed to get credentials:", error);
      return [];
    }
  }

  async saveCredentials(credentials: Credential[]): Promise<void> {
    try {
      await this.set(StorageKeys.CREDENTIALS, credentials);
    } catch (error) {
      console.error("Failed to save credentials:", error);
      throw error;
    }
  }

  async getCredentialsByType(type: string): Promise<Credential[]> {
    const allCredentials = await this.getCredentials();
    return allCredentials.filter((cred) => cred.type === type);
  }

  async getWorkflowExecutions(
    options?: getWorkflowExecutionsOptions,
  ): Promise<WorkflowExecution[]> {
    const { limit, reverse = true } = options || {};
    try {
      let result = (await this.get(StorageKeys.WORKFLOW_EXECUTIONS)) || [];
      if (limit && limit > 0) {
        result = result.slice(-limit);
      }
      if (reverse) {
        result = result.reverse();
      }
      return result;
    } catch (error) {
      console.error("Failed to get workflow executions:", error);
      return [];
    }
  }

  async saveWorkflowExecutions(executions: WorkflowExecution[]): Promise<void> {
    try {
      await this.set(StorageKeys.WORKFLOW_EXECUTIONS, executions);
      console.debug("Workflow executions saved successfully");
    } catch (error) {
      console.error("Failed to save workflow executions:", error);
      throw error;
    }
  }

  async saveWorkflowExecution(execution: WorkflowExecution): Promise<void> {
    try {
      const executions = await this.getWorkflowExecutions({
        reverse: false,
        limit: MAX_EXECUTIONS_HISTORY - 1,
      });
      const newExecutions = [...(executions || []), execution];
      await this.set(StorageKeys.WORKFLOW_EXECUTIONS, newExecutions);
      console.debug("Workflow execution saved successfully");

      // update stats
      const stats = await this.getSessionWorkflowExecutionStats();
      const newStats: WorkflowExecutionStats = {
        total: stats.total + 1,
        successful:
          stats.successful + (execution.status === "completed" ? 1 : 0),
        failed: stats.failed + (execution.status === "failed" ? 1 : 0),
      };
      await this.setSessionWorkflowExecutionStats(newStats);
    } catch (error) {
      console.error("Failed to save workflow execution:", error);
      throw error;
    }
  }

  async clearWorkflowExecutions(): Promise<void> {
    try {
      await this.remove(StorageKeys.WORKFLOW_EXECUTIONS);
      console.debug("All workflow executions cleared successfully");
    } catch (error) {
      console.error("Failed to clear workflow executions:", error);
      throw error;
    }
  }

  async getSessionWorkflowExecutionStats(): Promise<WorkflowExecutionStats> {
    try {
      const result = await this.get(
        StorageKeys.SESSION_WORKFLOW_EXECUTION_STATS,
      );
      if (result) {
        return result;
      }
    } catch (error) {
      console.error("Failed to get workflow executions:", error);
    }
    return { total: 0, successful: 0, failed: 0 };
  }

  async setSessionWorkflowExecutionStats(stats: WorkflowExecutionStats) {
    try {
      await this.set(StorageKeys.SESSION_WORKFLOW_EXECUTION_STATS, stats);
      console.debug("Workflow execution stats saved successfully");
    } catch (error) {
      console.error("Failed to save workflow executions:", error);
      throw error;
    }
  }

  async clearSessionWorkflowExecutionStats() {
    try {
      await this.remove(StorageKeys.SESSION_WORKFLOW_EXECUTION_STATS);
    } catch (error) {
      console.error("Failed to clear workflow executions:", error);
      throw error;
    }
  }

  // Convenience methods for listeners
  addWorkflowsListener(
    callback: (workflows: WorkflowDefinition[]) => void,
  ): () => void {
    return this.addListener(StorageKeys.WORKFLOWS, callback);
  }

  addCredentialsListener(
    callback: (credentials: Credential[]) => void,
  ): () => void {
    return this.addListener(StorageKeys.CREDENTIALS, callback);
  }

  addWorkflowExecutionsListener(
    callback: (executions: WorkflowExecution[]) => void,
  ): () => void {
    return this.addListener(StorageKeys.WORKFLOW_EXECUTIONS, callback);
  }
}

// Background storage client - communicates directly with StorageServer
export class BackgroundStorageClient extends StorageClientBase {
  private storageServer: StorageServer;

  constructor() {
    super();
    this.storageServer = StorageServer.getInstance();
  }

  protected async get(key: string): Promise<any> {
    return await this.storageServer.get(key);
  }

  protected async set(key: string, value: any): Promise<void> {
    await this.storageServer.set(key, value);
  }

  protected async remove(key: string): Promise<void> {
    await this.storageServer.remove(key);
  }

  public addListener(key: string, callback: (value: any) => void): () => void {
    return this.storageServer.addListener(key, callback);
  }
}

// Content storage client - communicates via messages
export class ContentStorageClient extends StorageClientBase {
  private listeners: Map<string, Set<(value: any) => void>> = new Map();
  private port: Runtime.Port | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  protected async get(key: string): Promise<any> {
    const result = await sendMessageToBackground(StorageAction.GET, { key });

    if (!result || !result.success) {
      throw new Error(
        `Failed to get key ${key}: ${result?.error || "Unknown error"}`,
      );
    }
    return result.value;
  }

  protected async set(key: string, value: any): Promise<void> {
    const result = await sendMessageToBackground(StorageAction.SET, {
      key,
      value,
    });

    if (!result || !result.success) {
      throw new Error(
        `Failed to set key ${key}: ${result?.error || "Unknown error"}`,
      );
    }
  }

  protected async remove(key: string): Promise<void> {
    const result = await sendMessageToBackground(StorageAction.REMOVE, {
      key,
    });
    if (!result || !result.success) {
      throw new Error(
        `Failed to remove key ${key}: ${result?.error || "Unknown error"}`,
      );
    }
  }

  public addListener(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback);

    // Only try to connect if we don't have a port yet
    if (!this.port && !this.isConnecting) {
      this.initPort().catch((error) => {
        console.warn("Failed to establish storage listener connection:", error);
      });
    }

    // Subscribe to this key if we have a connection
    if (this.port) {
      this.port.postMessage({
        type: StorageAction.SUBSCRIBE,
        key,
      });
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(key);
          // Unsubscribe from this key
          if (this.port) {
            this.port.postMessage({
              type: StorageAction.UNSUBSCRIBE,
              key,
            });
          }
        }
      }
    };
  }

  private async initPort(): Promise<void> {
    if (this.isConnecting || this.port) return;

    this.isConnecting = true;

    try {
      // Check if background script is available
      await this.pingBackgroundScript();

      this.port = browser.runtime.connect({ name: "storage-listener" });

      if (this.port) {
        this.port.onMessage.addListener((message) => {
          if (message.type === StorageAction.CHANGE_NOTIFICATION) {
            this.handleStorageChange(message.key, message.value);
          }
        });

        this.port.onDisconnect.addListener(() => {
          this.port = null;
          this.isConnecting = false;

          // Only attempt reconnection if we have active listeners
          if (this.listeners.size > 0) {
            this.scheduleReconnect();
          }
        });

        // Re-subscribe to all existing listeners
        this.listeners.forEach((_callbacks, key) => {
          if (this.port) {
            this.port.postMessage({
              type: StorageAction.SUBSCRIBE,
              key,
            });
          }
        });

        this.reconnectAttempts = 0;
        this.isConnecting = false;
      }
    } catch (error) {
      this.isConnecting = false;
      console.warn(
        "Failed to connect to background script for storage listeners:",
        error,
      );

      if (this.listeners.size > 0) {
        this.scheduleReconnect();
      }
    }
  }

  private async pingBackgroundScript(): Promise<void> {
    try {
      await sendMessageToBackground("PING");
    } catch (error) {
      throw new Error("Failed to ping background script");
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(
        "Max reconnection attempts reached. Storage listeners disabled.",
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      30000,
    );

    setTimeout(() => {
      if (this.listeners.size > 0) {
        this.initPort();
      }
    }, delay);
  }

  private handleStorageChange(key: string, value: any) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          console.error(
            `Error in storage listener callback for key ${key}:`,
            error,
          );
        }
      });
    }
  }
}
