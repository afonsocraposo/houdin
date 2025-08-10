import { HttpListenerService } from "../services/httpListener";
import { StorageManager } from "../services/storage";
import { WorkflowExecution, NodeExecutionResult } from "../types/workflow";

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

const backgroundTracker = new BackgroundExecutionTracker();

// Initialize HTTP listener service
let httpListener: HttpListenerService;

try {
  httpListener = HttpListenerService.getInstance(runtime);

  // Set up callback to handle HTTP triggers
  httpListener.setTriggerCallback((data, triggerNodeId, workflowId) => {
    // Find the tab that made the request
    runtime.tabs
      .sendMessage(data.request.tabId, {
        type: "HTTP_REQUEST_TRIGGER",
        data,
        triggerNodeId,
        workflowId,
      })
      .catch((error: any) => {
        console.error("Error sending HTTP trigger message:", error);
      });
  });

  // Pre-register HTTP triggers for active workflows
  initializeActiveHttpTriggers();
} catch (error) {
  console.error("Failed to initialize HttpListenerService:", error);
}

async function initializeActiveHttpTriggers(): Promise<void> {
  try {
    // Clear existing triggers first
    if (httpListener) {
      httpListener.clearAllTriggers();
    }

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
          httpListener.registerTrigger(
            workflow.id,
            triggerNode.id,
            config.urlPattern,
            config.method || "ANY",
          );
        }
      }
    }
  } catch (error) {
    console.error("Error initializing active HTTP triggers:", error);
  }
}

runtime.runtime.onMessage.addListener(
  (message: any, _sender: any, sendResponse: (response: any) => void) => {
    if (message.type === "REGISTER_HTTP_TRIGGER") {
      if (httpListener) {
        httpListener.registerTrigger(
          message.workflowId,
          message.triggerNodeId,
          message.urlPattern,
          message.method,
        );
      } else {
        console.error(
          "HttpListenerService not available for trigger registration",
        );
      }
    } else if (message.type === "UNREGISTER_HTTP_TRIGGER") {
      if (httpListener) {
        httpListener.unregisterTrigger(
          message.workflowId,
          message.triggerNodeId,
        );
      } else {
        console.error(
          "HttpListenerService not available for trigger unregistration",
        );
      }
    } else if (message.type === "SYNC_HTTP_TRIGGERS") {
      // Re-sync HTTP triggers for active workflows
      initializeActiveHttpTriggers();
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

runtime.runtime.onInstalled.addListener(() => {
  console.debug("Extension installed");
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
// If you need this functionality, add "webNavigation" to permissions
if (runtime.webNavigation) {
  runtime.webNavigation.onBeforeNavigate.addListener((details: any) => {
    if (details.url.includes("changeme.config")) {
      const configUrl = runtime.runtime.getURL("src/config/index.html");
      runtime.tabs.update(details.tabId, { url: configUrl });
    }
  });
}
