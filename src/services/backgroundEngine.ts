import { sendMessageToContentScript } from "@/lib/messages";
import { BackgroundStorageClient } from "@/services/storage";
import {
  TriggerCommand,
  WorkflowCommandType,
} from "@/types/background-workflow";
import {
  TriggerNodeData,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { initializeBackgroundActions } from "./actionInitializer";
import { WorkflowExecutor } from "./workflow";

// const runtime = (typeof browser !== "undefined" ? browser : chrome) as any;

export class BackgroundWorkflowEngine {
  private activeExecutors = new Map<string, WorkflowExecutor>();
  private workflows: WorkflowDefinition[] = [];
  private storageClient: BackgroundStorageClient;

  constructor() {
    this.storageClient = new BackgroundStorageClient();
    initializeBackgroundActions();
  }

  async initialize(): Promise<void> {
    await this.loadWorkflows();
    this.setupStorageListener();
  }

  private setupStorageListener(): void {
    this.storageClient.addWorkflowsListener((workflows) => {
      console.debug("Workflows updated, reloading...");
      this.workflows = workflows;
    });
  }

  private async loadWorkflows(): Promise<void> {
    this.workflows = await this.storageClient.getWorkflows();
    console.debug("Loaded workflows:", this.workflows.length);
  }

  async onNewUrl(tabId: number, url: string): Promise<void> {
    // Get the active workflow IDs for this tab
    const activeWorkflowIds = Array.from(this.activeExecutors.values())
      .filter((executor) => executor.tabId === tabId)
      .map((executor) => executor.workflowId);
    // Find workflows that match the URL pattern
    const matchingWorkflows = this.workflows
      .filter(
        (workflow) =>
          workflow.enabled && this.matchesUrlPattern(workflow.urlPattern, url),
      )
      .filter((workflow) => !activeWorkflowIds.includes(workflow.id));

    if (matchingWorkflows.length === 0) {
      console.debug("No matching workflows for URL:", url);
      return;
    }

    matchingWorkflows.forEach((workflow) => {
      this.getWorkflowTriggers(workflow).forEach((triggerNode) => {
        this.setupTrigger(tabId, workflow, triggerNode);
      });
    });
  }

  private async setupTrigger(
    tabId: number,
    workflow: WorkflowDefinition,
    node: WorkflowNode,
  ): Promise<void> {
    // Access trigger type correctly - it's stored as triggerType, not type
    const triggerType = (node.data as TriggerNodeData)?.triggerType;
    const triggerConfig = node.data?.config || {};

    if (!triggerType) {
      console.error(
        "No trigger type found for node:",
        node.id,
        "node.data:",
        node.data,
      );
      return;
    }

    // Send command to content script to set up the trigger
    const message: TriggerCommand = {
      type: WorkflowCommandType.INIT_TRIGGER,
      workflowId: workflow.id,
      tabId: tabId,
      nodeType: triggerType,
      nodeConfig: triggerConfig,
      nodeId: node.id,
    };
    try {
      await sendMessageToContentScript(
        tabId,
        WorkflowCommandType.INIT_TRIGGER,
        message,
      );
    } catch (error) {
      console.error("Error sending trigger setup message:", error);
    }
  }

  public dispatchExecutor(
    url: string,
    tabId: number,
    workflowId: string,
    triggerNodeId: string,
    triggerData: any,
    duration: number,
  ) {
    const workflow = this.workflows.find((wf) => wf.id === workflowId);
    if (!workflow) {
      console.error(`Workflow not found: ${workflowId}`);
      return;
    }
    const triggerNode = workflow.nodes.find(
      (node) => node.id === triggerNodeId,
    );
    if (!triggerNode) {
      console.error(`Trigger node not found: ${triggerNodeId}`);
      return;
    }
    const executor = new WorkflowExecutor(
      tabId,
      workflow,
      triggerNode,
      url,
      this.removeActiveExecutor,
    );
    this.activeExecutors.set(executor.id, executor);

    executor.start(triggerData, duration).catch((error) => {
      console.error(`Error executing workflow ${workflow.name}:`, error);
    });
  }

  private removeActiveExecutor = (executorId: string): void => {
    console.debug(
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

  private matchesUrlPattern(pattern: string, fullUrl: string): boolean {
    const _url = new URL(fullUrl);
    // ignore query params but include hash
    const url = _url.origin + _url.pathname + _url.hash;
    try {
      // Convert simple wildcard pattern to regex
      const regexPattern =
        pattern
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special regex characters
          .replace(/\\\*/g, ".*") // Convert * to .*
          .replace(/\\\?/g, ".") + // Convert ? to .
        "\\/?"; // Optional trailing slash

      const regex = new RegExp(`^${regexPattern}$`, "i");
      return regex.test(url);
    } catch (error) {
      console.error("Invalid URL pattern:", pattern, error);
      return false;
    }
  }
}
