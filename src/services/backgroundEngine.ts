import { sendMessageToContentScript } from "@/lib/messages";
import {
  CleanupWorkflowTriggersCommand,
  TriggerCommand,
  WorkflowCommandType,
} from "@/types/background-workflow";
import {
  TriggerNodeData,
  WorkflowDefinition,
  WorkflowNode,
} from "@/types/workflow";
import { WorkflowExecutor } from "./workflow/workflow";
import { ExecutionContext } from "./workflow/executionContext";
import { matchesUrlPattern } from "@/utils/helpers";
import { initializeCredentials } from "./credentialInitializer";
import { useStore } from "@/store";
import { initializeBackgroundActions } from "./backgroundActionInitializer";

export class BackgroundWorkflowEngine {
  private activeExecutors = new Map<string, WorkflowExecutor>();
  private activeTabWorkflows = new Map<number, Set<string>>();
  private activeTabUrls = new Map<number, string>();
  private tabQueues = new Map<number, Promise<void>>();
  private tabGenerations = new Map<number, number>();
  private workflows: WorkflowDefinition[] = [];

  constructor() {
    initializeBackgroundActions();
    initializeCredentials();
  }

  async initialize(): Promise<void> {
    this.loadWorkflows();
    this.setupStoreListener();
  }

  private setupStoreListener(): void {
    useStore.subscribe((state) => {
      const currentWorkflowsById = new Map(
        state.workflows.map((workflow) => [workflow.id, workflow]),
      );
      const workflowsToCleanup = this.workflows.filter((workflow) => {
        const currentWorkflow = currentWorkflowsById.get(workflow.id);
        return (
          !currentWorkflow ||
          !currentWorkflow.enabled ||
          currentWorkflow.modifiedAt !== workflow.modifiedAt
        );
      });

      this.workflows = state.workflows;

      for (const workflow of workflowsToCleanup) {
        this.cleanupWorkflowEverywhere(workflow.id).catch((error) => {
          console.warn("Failed to cleanup inactive workflow:", error);
        });
      }
    });
  }

  private loadWorkflows(): void {
    this.workflows = useStore.getState().workflows;
    console.debug("Loaded workflows:", this.workflows.length);
  }

  async onNewUrl(tabId: number, url: string): Promise<void> {
    const generation = this.getTabGeneration(tabId);
    const previousQueue = this.tabQueues.get(tabId) || Promise.resolve();
    const nextQueue = previousQueue
      .catch(() => {})
      .then(() => this.handleNewUrl(tabId, url, generation))
      .finally(() => {
        if (this.tabQueues.get(tabId) === nextQueue) {
          this.tabQueues.delete(tabId);
        }
      });

    this.tabQueues.set(tabId, nextQueue);
    await nextQueue;
  }

  private async handleNewUrl(
    tabId: number,
    url: string,
    generation: number,
  ): Promise<void> {
    // Get the active workflow IDs for this tab
    const runningWorkflowIds = Array.from(this.activeExecutors.values())
      .filter((executor) => executor.tabId === tabId)
      .map((executor) => executor.workflowId);
    // Find workflows that match the URL pattern
    const matchingWorkflows = this.workflows.filter(
      (workflow) =>
        workflow.enabled && matchesUrlPattern(url, workflow.urlPattern, true),
    );
    const matchingWorkflowIds = new Set(
      matchingWorkflows.map((workflow) => workflow.id),
    );
    const activeWorkflowIds =
      this.activeTabWorkflows.get(tabId) || new Set<string>();
    const activeUrl = this.activeTabUrls.get(tabId);

    console.debug("BackgroundWorkflowEngine: Evaluating URL", {
      tabId,
      url,
      previousUrl: activeUrl,
      activeWorkflowIds: Array.from(activeWorkflowIds),
      matchingWorkflowIds: Array.from(matchingWorkflowIds),
      generation,
    });

    if (
      activeUrl === url &&
      BackgroundWorkflowEngine.setsEqual(activeWorkflowIds, matchingWorkflowIds)
    ) {
      console.debug("BackgroundWorkflowEngine: URL evaluation unchanged", {
        tabId,
        url,
      });
      return;
    }

    const workflowsToCleanup = Array.from(activeWorkflowIds);

    if (workflowsToCleanup.length > 0) {
      console.debug("BackgroundWorkflowEngine: Cleaning up workflows", {
        tabId,
        workflowIds: workflowsToCleanup,
      });
      await this.cleanupTabWorkflows(tabId, workflowsToCleanup);
    }

    if (this.getTabGeneration(tabId) !== generation) {
      return;
    }

    if (matchingWorkflows.length === 0 && runningWorkflowIds.length === 0) {
      console.debug("BackgroundWorkflowEngine: No matching workflows", {
        tabId,
        url,
      });
      this.activeTabUrls.delete(tabId);
      return;
    }

    const setupWorkflowIds = new Set<string>();
    for (const workflow of matchingWorkflows) {
      for (const triggerNode of this.getWorkflowTriggers(workflow)) {
        await this.setupTrigger(tabId, workflow, triggerNode);
        if (this.getTabGeneration(tabId) !== generation) {
          await this.cleanupTabWorkflows(tabId, [workflow.id]);
          return;
        }
      }
      setupWorkflowIds.add(workflow.id);
    }

    this.activeTabWorkflows.set(tabId, setupWorkflowIds);
    this.activeTabUrls.set(tabId, url);
    console.debug("BackgroundWorkflowEngine: Activated workflows", {
      tabId,
      url,
      workflowIds: Array.from(setupWorkflowIds),
    });
  }

  public clearTab(tabId: number): void {
    this.activeTabWorkflows.delete(tabId);
    this.activeTabUrls.delete(tabId);
    this.tabQueues.delete(tabId);
    this.tabGenerations.set(tabId, this.getTabGeneration(tabId) + 1);

    for (const [executorId, executor] of this.activeExecutors.entries()) {
      if (executor.tabId === tabId) {
        this.activeExecutors.delete(executorId);
      }
    }
  }

  private async cleanupTabWorkflows(
    tabId: number,
    workflowIds: string[],
  ): Promise<void> {
    try {
      const message: CleanupWorkflowTriggersCommand = {
        type: WorkflowCommandType.CLEANUP_WORKFLOW_TRIGGERS,
        workflowIds,
      };

      await sendMessageToContentScript(
        tabId,
        WorkflowCommandType.CLEANUP_WORKFLOW_TRIGGERS,
        message,
      );
    } catch (error) {
      console.warn("Failed to cleanup workflow triggers:", error);
    } finally {
      const activeWorkflowIds = this.activeTabWorkflows.get(tabId);
      if (activeWorkflowIds) {
        workflowIds.forEach((workflowId) =>
          activeWorkflowIds.delete(workflowId),
        );
        if (activeWorkflowIds.size === 0) {
          this.activeTabWorkflows.delete(tabId);
          this.activeTabUrls.delete(tabId);
        }
      }
    }
  }

  private async cleanupWorkflowEverywhere(workflowId: string): Promise<void> {
    const cleanupTasks = Array.from(this.activeTabWorkflows.entries())
      .filter(([, workflowIds]) => workflowIds.has(workflowId))
      .map(([tabId]) => this.cleanupTabWorkflows(tabId, [workflowId]));

    await Promise.all(cleanupTasks);
  }

  private static setsEqual(first: Set<string>, second: Set<string>): boolean {
    if (first.size !== second.size) return false;
    for (const value of first) {
      if (!second.has(value)) return false;
    }
    return true;
  }

  private getTabGeneration(tabId: number): number {
    return this.tabGenerations.get(tabId) || 0;
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
      const pageTitle = tab.title || "";

      const metadata = {
        url,
        pageTitle,
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
    pageTitle,
    tabId,
    workflowId,
    triggerNodeId,
    triggerData,
    duration,
    config,
  }: {
    url: string;
    pageTitle: string;
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
      pageTitle,
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
