import { StorageManager } from "../services/storage";
import { WorkflowDefinition, WorkflowNode } from "../types/workflow";
import { initializeBackgroundActions } from "./actionInitializer";
import { WorkflowExecutor } from "./workflow";

// const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

export class BackgroundWorkflowEngine {
  private activeExecutors = new Map<string, WorkflowExecutor>();
  private workflows: WorkflowDefinition[] = [];
  private storageManager: StorageManager;

  constructor() {
    this.storageManager = StorageManager.getInstance();
    initializeBackgroundActions();
  }

  async initialize(): Promise<void> {
    console.debug("Content injector initialized");
    await this.loadWorkflows();
    this.setupStorageListener();
  }

  private setupStorageListener(): void {
    this.storageManager.onStorageChanged((workflows) => {
      console.debug("Workflows updated, reloading...");
      this.workflows = workflows;

      // Sync HTTP triggers in background script
      // chrome.runtime.sendMessage({ type: "SYNC_HTTP_TRIGGERS" });

      // this.scheduleProcessing();
    });
  }

  private async loadWorkflows(): Promise<void> {
    this.workflows = await this.storageManager.getWorkflows();
    console.debug("Loaded workflows:", this.workflows.length);
  }

  async onNewUrl(tabId: number, url: string): Promise<void> {
    const activeWorkflowIds = Array.from(this.activeExecutors.values()).map(
      (executor) => executor.workflowId,
    );
    // Find workflows that match the URL pattern
    const matchingWorkflows = this.workflows
      .filter(
        (workflow) =>
          workflow.enabled && this.matchesUrlPattern(workflow.urlPattern, url),
      )
      // check if the workflow is not already active
      .filter((workflow) => activeWorkflowIds.indexOf(workflow.id) === -1);

    if (matchingWorkflows.length === 0) {
      console.debug("No matching workflows for URL:", url);
      return;
    }

    matchingWorkflows.forEach((workflow) => {
      this.getWorkflowTriggers(workflow).forEach((triggerNode) => {
        const executor = new WorkflowExecutor(
          tabId,
          workflow,
          triggerNode,
          url,
          this.removeActiveExecutor,
        );
        this.activeExecutors.set(executor.id, executor);

        executor.execute().catch((error) => {
          console.error(`Error executing workflow ${workflow.name}:`, error);
        });
      });
    });
  }

  private removeActiveExecutor = (executorId: string): void => {
    console.log(
      `Removing active executor: ${executorId}`,
      this.activeExecutors,
    );
    // wait some time to prevent the workflow from being triggered again immediately
    setTimeout(() => {
      this.activeExecutors?.delete(executorId);
    }, 1000);
  };

  private getWorkflowTriggers(workflow: WorkflowDefinition): WorkflowNode[] {
    return workflow.nodes.filter((node) => node.type === "trigger");
  }

  private matchesUrlPattern(pattern: string, url: string): boolean {
    try {
      // Convert simple wildcard pattern to regex
      const regexPattern = pattern
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex characters
        .replace(/\\\*/g, ".*") // Convert * to .*
        .replace(/\\\?/g, "."); // Convert ? to .

      const regex = new RegExp(`^${regexPattern}$`, "i");
      return regex.test(url);
    } catch (error) {
      console.error("Invalid URL pattern:", pattern, error);
      return false;
    }
  }
}
