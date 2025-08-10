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

runtime.runtime.onMessage.addListener(
  (message: any, _sender: any, sendResponse: (response: any) => void) => {
    if (message.type === "EXECUTION_STARTED") {
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
if (runtime.webNavigation) {
  runtime.webNavigation.onBeforeNavigate.addListener((details: any) => {
    if (details.url.includes("changeme.config")) {
      const configUrl = runtime.runtime.getURL("src/config/index.html");
      runtime.tabs.update(details.tabId, { url: configUrl });
    }
  });
}