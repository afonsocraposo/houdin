import { sendMessageToContentScript } from "@/lib/messages";
import { BackgroundStorageClient } from "@/services/storage";
import {
  ReadinessResponse,
  TriggerCommand,
  WorkflowCommandType,
} from "@/types/background-workflow";
import {
  TriggerNodeData,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { initializeBackgroundActions } from "./actionInitializer";
import { WorkflowExecutor } from "./workflow/workflow";
import { matchesUrlPattern } from "@/utils/helpers";

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
    const runningWorkflowIds = Array.from(this.activeExecutors.values())
      .filter((executor) => executor.tabId === tabId)
      .map((executor) => executor.workflowId);
    // Find workflows that match the URL pattern
    const matchingWorkflows = this.workflows
      .filter(
        (workflow) =>
          workflow.enabled && matchesUrlPattern(url, workflow.urlPattern, true),
      )
      .filter((workflow) => !runningWorkflowIds.includes(workflow.id));

    if (matchingWorkflows.length == 0 && runningWorkflowIds.length == 0) {
      return;
    }

    const success = await this.initializeContentScript(tabId);
    if (!success) {
      return;
    }

    matchingWorkflows.forEach((workflow) => {
      this.getWorkflowTriggers(workflow).forEach((triggerNode) => {
        this.setupTrigger(tabId, workflow, triggerNode);
      });
    });
  }

  private async initializeContentScript(tabId: number): Promise<boolean> {
    return BackgroundWorkflowEngine.waitForContentScriptReady(tabId);
  }

  static async waitForContentScriptReady(
    tabId: number,
    timeoutMs: number = 10000,
    retryIntervalMs: number = 500,
  ): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const readinessResponse = (await sendMessageToContentScript(
          tabId,
          WorkflowCommandType.CHECK_READINESS,
        )) as ReadinessResponse;

        if (readinessResponse?.ready) {
          console.debug("Content script ready for tab:", tabId);
          return true;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.debug(
          "Content script not yet ready for tab:",
          tabId,
          errorMessage,
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, retryIntervalMs));
    }

    return false;
  }

  private async setupTrigger(
    tabId: number,
    workflow: WorkflowDefinition,
    node: WorkflowNode,
  ): Promise<void> {
    // Access trigger type correctly - it's stored as triggerType, not type
    const triggerType = (node.data as TriggerNodeData)?.type;
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

    // First, check if content script is ready and initialize it if needed
    try {
      console.debug("Setting up trigger:", triggerType);

      // Now send command to content script to set up the trigger
      const message: TriggerCommand = {
        type: WorkflowCommandType.INIT_TRIGGER,
        workflowId: workflow.id,
        tabId: tabId,
        nodeType: triggerType,
        nodeConfig: triggerConfig,
        nodeId: node.id,
      };

      await sendMessageToContentScript(
        tabId,
        WorkflowCommandType.INIT_TRIGGER,
        message,
      );
    } catch (error) {
      console.error("Error setting up trigger:", error);
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
}
