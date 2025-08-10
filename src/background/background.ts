import { WorkflowExecution, NodeExecutionResult } from "../types/workflow";
import { StorageManager } from "../services/storage";

const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

// Session-based execution tracking in background script
class BackgroundExecutionTracker {
  private executions: Map<string, WorkflowExecution> = new Map();

  startExecution(execution: WorkflowExecution): void {
    this.executions.set(execution.id, execution);
  }

  completeExecution(
    executionId: string,
    status: "completed" | "failed",
    completedAt: number,
  ): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = status;
      execution.completedAt = completedAt;
    }
  }

  addNodeResult(executionId: string, nodeResult: NodeExecutionResult): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.nodeResults.push(nodeResult);
    }
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values()).sort(
      (a, b) => b.startedAt - a.startedAt,
    );
  }

  clearExecutions(): void {
    this.executions.clear();
  }
}

// HTTP Trigger Management for Manifest V3
// Uses content script fetch interception instead of webRequest API
class HttpTriggerManager {
  private triggers = new Map<string, {
    workflowId: string;
    triggerNodeId: string;
    urlPattern: string;
    method: string;
  }>();

  registerTrigger(workflowId: string, triggerNodeId: string, urlPattern: string, method: string): void {
    const triggerKey = `${workflowId}-${triggerNodeId}`;
    this.triggers.set(triggerKey, {
      workflowId,
      triggerNodeId,
      urlPattern,
      method
    });
    
    console.debug("HTTP Trigger registered:", { workflowId, triggerNodeId, urlPattern, method });
    
    // Notify all content scripts about the new trigger
    this.broadcastTriggersToContentScripts();
  }

  unregisterTrigger(workflowId: string, triggerNodeId: string): void {
    const triggerKey = `${workflowId}-${triggerNodeId}`;
    this.triggers.delete(triggerKey);
    
    console.debug("HTTP Trigger unregistered:", { workflowId, triggerNodeId });
    
    // Notify all content scripts about the change
    this.broadcastTriggersToContentScripts();
  }

  clearAllTriggers(): void {
    this.triggers.clear();
    this.broadcastTriggersToContentScripts();
  }

  getAllTriggers(): Array<{workflowId: string, triggerNodeId: string, urlPattern: string, method: string}> {
    return Array.from(this.triggers.values());
  }

  private async broadcastTriggersToContentScripts(): Promise<void> {
    try {
      const tabs = await runtime.tabs.query({});
      const triggers = this.getAllTriggers();
      
      console.debug("Broadcasting triggers to content scripts:", triggers.length);
      
      for (const tab of tabs) {
        if (tab.id) {
          runtime.tabs.sendMessage(tab.id, {
            type: "UPDATE_HTTP_TRIGGERS",
            triggers
          }).catch(() => {
            // Ignore errors for tabs without content scripts
          });
        }
      }
    } catch (error) {
      console.error("Error broadcasting triggers to content scripts:", error);
    }
  }

  handleHttpTriggerMatch(data: any, triggerNodeId: string, workflowId: string, tabId: number): void {
    console.debug("HTTP Trigger matched:", { workflowId, triggerNodeId, tabId });
    
    // Send trigger event back to the tab that made the request
    runtime.tabs.sendMessage(tabId, {
      type: "HTTP_REQUEST_TRIGGER",
      data,
      triggerNodeId,
      workflowId,
    }).catch((error: any) => {
      console.error("Error sending HTTP trigger message:", error);
    });
  }
}

const backgroundTracker = new BackgroundExecutionTracker();
const httpTriggerManager = new HttpTriggerManager();

// Initialize HTTP triggers from storage
async function initializeActiveHttpTriggers(): Promise<void> {
  try {
    console.debug("Initializing active HTTP triggers...");
    
    // Clear existing triggers first
    httpTriggerManager.clearAllTriggers();

    const storageManager = StorageManager.getInstance();
    const workflows = await storageManager.getWorkflows();

    // Find all enabled workflows with HTTP triggers
    for (const workflow of workflows) {
      if (!workflow.enabled) continue;

      const httpTriggerNodes = workflow.nodes.filter(
        (node) =>
          node.type === "trigger" && node.data?.triggerType === "http-request",
      );

      for (const triggerNode of httpTriggerNodes) {
        const config = triggerNode.data?.config;
        if (config?.urlPattern) {
          httpTriggerManager.registerTrigger(
            workflow.id,
            triggerNode.id,
            config.urlPattern,
            config.method || "ANY",
          );
        }
      }
    }
    
    console.debug("HTTP triggers initialized:", httpTriggerManager.getAllTriggers().length);
  } catch (error) {
    console.error("Error initializing active HTTP triggers:", error);
  }
}

runtime.runtime.onMessage.addListener(
  (message: any, sender: any, sendResponse: (response: any) => void) => {
    if (message.type === "REGISTER_HTTP_TRIGGER") {
      httpTriggerManager.registerTrigger(
        message.workflowId,
        message.triggerNodeId,
        message.urlPattern,
        message.method,
      );
    } else if (message.type === "UNREGISTER_HTTP_TRIGGER") {
      httpTriggerManager.unregisterTrigger(
        message.workflowId,
        message.triggerNodeId,
      );
    } else if (message.type === "SYNC_HTTP_TRIGGERS") {
      // Re-sync HTTP triggers for active workflows
      initializeActiveHttpTriggers();
    } else if (message.type === "GET_HTTP_TRIGGERS") {
      // Send current triggers to content script
      const triggers = httpTriggerManager.getAllTriggers();
      sendResponse({ triggers });
    } else if (message.type === "HTTP_TRIGGER_MATCHED") {
      // Handle HTTP trigger match from content script
      httpTriggerManager.handleHttpTriggerMatch(
        message.data,
        message.triggerNodeId,
        message.workflowId,
        sender.tab?.id || 0
      );
    } else if (message.type === "EXECUTION_STARTED") {
      // Track workflow execution
      console.debug("Background: Execution started", message.data);
      backgroundTracker.startExecution(message.data);
    } else if (message.type === "EXECUTION_COMPLETED") {
      // Complete workflow execution
      console.debug("Background: Execution completed", message.data);
      backgroundTracker.completeExecution(
        message.data.executionId,
        message.data.status,
        message.data.completedAt,
      );
    } else if (message.type === "NODE_RESULT_ADDED") {
      // Add node result to execution
      console.debug("Background: Node result added", message.data);
      backgroundTracker.addNodeResult(
        message.data.executionId,
        message.data.nodeResult,
      );
    } else if (message.type === "GET_EXECUTIONS") {
      // Return all executions to popup
      const executions = backgroundTracker.getAllExecutions();
      console.debug("Background: Returning executions", executions.length);
      sendResponse({ executions });
    } else if (message.type === "EXECUTIONS_CLEARED") {
      // Clear all executions
      console.debug("Background: Clearing executions");
      backgroundTracker.clearExecutions();
    }
  },
);

// Initialize triggers on startup
initializeActiveHttpTriggers();

runtime.runtime.onInstalled.addListener(() => {
  console.debug("Extension installed");
  // Re-initialize triggers on install
  initializeActiveHttpTriggers();
});

// For manifest v3, use action instead of browserAction
if (runtime.action) {
  runtime.action.onClicked.addListener((_tab: any) => {
    // Extension icon clicked
  });
}

// Handle navigation to changeme.config
runtime.tabs.onUpdated.addListener((tabId: number, changeInfo: any) => {
  if (changeInfo.url && changeInfo.url.includes("changeme.config")) {
    // Redirect to the config page
    const configUrl = runtime.runtime.getURL("src/config/index.html");
    runtime.tabs.update(tabId, { url: configUrl });
  }
});

// Note: webNavigation API requires additional permission in manifest v3
if (runtime.webNavigation) {
  runtime.webNavigation.onBeforeNavigate.addListener((details: any) => {
    if (details.url.includes("changeme.config")) {
      const configUrl = runtime.runtime.getURL("src/config/index.html");
      runtime.tabs.update(details.tabId, { url: configUrl });
    }
  });
}