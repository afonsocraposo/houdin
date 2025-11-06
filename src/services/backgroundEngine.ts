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
import { ExecutionContext } from "./workflow/executionContext";
import { matchesUrlPattern } from "@/utils/helpers";
import { NotificationService } from "./notification";

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
      NotificationService.showErrorNotificationFromBackground({
        title: "Failed to start workflow",
        message: `Could not initialize content script for workflows on this page.`,
      });
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
    let triggerConfig = node.data?.config || {};

    if (!triggerType) {
      console.error(
        "No trigger type found for node:",
        node.id,
        "node.data:",
        node.data,
      );
      return;
    }

    // Create execution context for variable interpolation
    try {
      // Get current tab URL for metadata
      const tab = await chrome.tabs.get(tabId);
      const url = tab.url || "";

      const metadata = {
        url,
        workflowId: workflow.id,
        executionId: `trigger-${Date.now()}`,
        startedAt: Date.now(),
      };

      const context = new ExecutionContext(metadata, workflow.variables || {});

      // Interpolate variables in trigger config
      const interpolatedConfig = { ...triggerConfig };
      for (const key in interpolatedConfig) {
        if (interpolatedConfig.hasOwnProperty(key)) {
          const value = interpolatedConfig[key];
          if (typeof value === "string") {
            interpolatedConfig[key] = context.interpolateVariables(value);
          }
        }
      }

      triggerConfig = interpolatedConfig;
    } catch (error) {
      console.warn("Failed to interpolate trigger config variables:", error);
      // Continue with original config if interpolation fails
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

  public dispatchExecutor({
    url,
    tabId,
    workflowId,
    triggerNodeId,
    triggerData,
    duration,
    config,
  }: {
    url: string;
    tabId: number;
    workflowId: string;
    triggerNodeId: string;
    triggerData: any;
    duration: number;
    config: Record<string, any>;
  }) {
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

    executor.start(triggerData, duration, config).catch((error) => {
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
