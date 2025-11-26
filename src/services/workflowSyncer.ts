import { ApiClient } from "@/api/client";
import browser from "./browser";
import { sendMessageToBackground } from "@/lib/messages";
import { useStore } from "@/store";
import { WorkflowDefinition } from "@/types/workflow";

export class WorkflowSyncer {
  static instance: WorkflowSyncer = new WorkflowSyncer();
  private static syncPromise: Promise<void> | null = null;
  private static throttledSyncPromise: Promise<void> | null = null;
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
  }

  static getInstance(): WorkflowSyncer {
    if (!WorkflowSyncer.instance) {
      WorkflowSyncer.instance = new WorkflowSyncer();
    }
    return WorkflowSyncer.instance;
  }

  startMessageListener(): void {
    browser.runtime.onMessage.addListener((message: any, _sender: any) => {
      if (message.type === "SYNC_WORKFLOWS") {
        return this.sync()
          .then(() => Promise.resolve(true))
          .catch((error) => {
            console.error("Error during workflow sync:", error);
            return Promise.reject(error);
          });
      } else if (message.type === "SYNC_WORKFLOWS_THROTTLED") {
        return this.throttledSync()
          .then(() => Promise.resolve(true))
          .catch((error) => {
            console.error("Error during throttled workflow sync:", error);
            return Promise.reject(error);
          });
      }
    });
  }

  private async canUserSync(): Promise<boolean> {
    try {
      const account = await ApiClient.getAccount();
      return account?.plan !== "free";
    } catch (error) {
      console.error("Failed to fetch user info for sync check:", error);
      return false;
    }
  }

  async sync(failQuiet: boolean = false): Promise<void> {
    const canSync = await this.canUserSync();
    if (!canSync) {
      const error = new Error(
        "User plan does not support workflow synchronization.",
      );
      useStore.getState().setSyncResult({
        success: false,
        error: error.message,
        timestamp: Date.now(),
      });
      useStore.getState().setStatus("error");
      if (failQuiet) {
        console.debug("Sync skipped:", error.message);
        return;
      }
      throw error;
    }

    if (WorkflowSyncer.syncPromise) {
      return WorkflowSyncer.syncPromise;
    }

    if (useStore.getState().isSyncing) {
      return;
    }

    useStore.getState().setIsSyncing(true);
    useStore.getState().setStatus("syncing");

    const failsafeTimeout = setTimeout(() => {
      console.warn("Sync took longer than 15 seconds, resetting sync state");
      useStore.getState().setIsSyncing(false);
      useStore.getState().setStatus("error");
      setTimeout(() => useStore.getState().setStatus("idle"), 3000);
    }, 15000);

    WorkflowSyncer.syncPromise = this.performSync();

    let _error;
    try {
      await WorkflowSyncer.syncPromise;
      clearTimeout(failsafeTimeout);
      useStore
        .getState()
        .setSyncResult({ success: true, timestamp: Date.now() });
      useStore.getState().setStatus("success");
      setTimeout(() => useStore.getState().setStatus("idle"), 2000);
    } catch (error) {
      clearTimeout(failsafeTimeout);
      console.error("Error during workflow sync:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      useStore.getState().setSyncResult({
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      });
      useStore.getState().setStatus("error");
      setTimeout(() => useStore.getState().setStatus("idle"), 3000);
      _error = error;
    } finally {
      WorkflowSyncer.syncPromise = null;
      useStore.getState().setIsSyncing(false);
    }
    if (_error) {
      throw _error;
    }
  }

  async throttledSync(): Promise<void> {
    if (WorkflowSyncer.throttledSyncPromise) {
      return WorkflowSyncer.throttledSyncPromise;
    }

    WorkflowSyncer.throttledSyncPromise = this.sync();

    try {
      await WorkflowSyncer.throttledSyncPromise;
    } finally {
      WorkflowSyncer.throttledSyncPromise = null;
    }
  }

  // private async performSync(): Promise<void> {
  //   console.debug("Starting workflow sync process...");
  //   const lastSync = useStore.getState().lastSynced;
  //   const remoteWorkflows = await this.client.listAllWorkflows();
  //   const localWorkflows = useStore.getState().workflows;
  //
  //   const localWorkflowIds = new Set(localWorkflows.map((wf) => wf.id));
  //   const localWorkflowMap = new Map(localWorkflows.map((wf) => [wf.id, wf]));
  //   const remoteWorkflowIds = new Set(remoteWorkflows.map((wf) => wf.id));
  //
  //   const deletedWorkflowIds = new Set(
  //     (await this.client.listDeletedWorkflows(lastSync || undefined)).map(
  //       (wf) => wf.id,
  //     ),
  //   );
  //
  //   for (const deletedWorkflowId of deletedWorkflowIds) {
  //     if (localWorkflowIds.has(deletedWorkflowId)) {
  //       console.debug(
  //         `Deleting local workflow missing on server: ${deletedWorkflowId}`,
  //       );
  //       useStore.getState().deleteWorkflow(deletedWorkflowId);
  //     }
  //   }
  //
  //   for (const remoteWorkflow of remoteWorkflows) {
  //     if (!localWorkflowMap.has(remoteWorkflow.id)) {
  //       if (
  //         remoteWorkflow.modifiedAt &&
  //         lastSync &&
  //         remoteWorkflow.modifiedAt < lastSync
  //       ) {
  //         console.debug(
  //           `Deleting workflow from server (was deleted locally): ${remoteWorkflow.id}`,
  //         );
  //         await this.client.deleteWorkflow(remoteWorkflow.id);
  //       } else {
  //         console.debug(
  //           `Syncing new workflow from server: ${remoteWorkflow.id}`,
  //         );
  //         useStore.getState().createWorkflow(remoteWorkflow);
  //       }
  //     } else {
  //       const localWorkflow = localWorkflowMap.get(remoteWorkflow.id);
  //       if (
  //         localWorkflow &&
  //         remoteWorkflow.modifiedAt &&
  //         localWorkflow.modifiedAt &&
  //         remoteWorkflow.modifiedAt > localWorkflow.modifiedAt
  //       ) {
  //         console.debug(
  //           `Updating local workflow from server: ${remoteWorkflow.id}`,
  //           "remote modifiedAt",
  //           new Date(remoteWorkflow.modifiedAt).toISOString(),
  //           "local modifiedAt",
  //           new Date(localWorkflow.modifiedAt).toISOString(),
  //         );
  //         useStore.getState().updateWorkflow(remoteWorkflow);
  //       } else if (
  //         localWorkflow &&
  //         localWorkflow.modifiedAt &&
  //         remoteWorkflow.modifiedAt &&
  //         localWorkflow.modifiedAt > remoteWorkflow.modifiedAt
  //       ) {
  //         console.debug(
  //           `Updating server workflow from local: ${remoteWorkflow.id}`,
  //         );
  //         await this.client.updateWorkflow(localWorkflow);
  //       }
  //     }
  //   }
  //
  //   for (const localWorkflow of localWorkflows) {
  //     if (!remoteWorkflowIds.has(localWorkflow.id)) {
  //       if (
  //         localWorkflow.modifiedAt &&
  //         lastSync &&
  //         localWorkflow.modifiedAt > lastSync
  //       ) {
  //         console.debug(`Creating new workflow on server: ${localWorkflow.id}`);
  //         await this.client.createWorkflow(localWorkflow);
  //       }
  //     }
  //   }
  //
  //   const currentTimestamp = Date.now();
  //   useStore.getState().setLastSynced(currentTimestamp);
  //   console.debug("Workflow sync process completed successfully");
  // }

  private async pull(): Promise<void> {
    const lastServerTime = useStore.getState().lastServerTime;
    const { updated, deleted, serverTime } =
      await this.client.pullWorkflows(lastServerTime);
    const workflows = useStore.getState().workflows;
    const workflowsMap = new Map(workflows.map((wf) => [wf.id, wf]));

    for (const workflow of updated) {
      const existing = workflowsMap.get(workflow.id);
      if (!existing || workflow.modifiedAt > existing.modifiedAt) {
        useStore.getState().updateWorkflow(workflow);
      }
    }

    for (const tombstone of deleted) {
      const existing = workflowsMap.get(tombstone.id);
      // Should I simply delete the existing workflow without checking modifiedAt?
      if (existing && tombstone.deletedAt > existing.modifiedAt) {
        useStore.getState().deleteWorkflow(tombstone.id);
      }
    }

    useStore.getState().setLastServerTime(serverTime);
  }

  private async push(): Promise<void> {
    const workflows = useStore.getState().workflows;
    const workflowMap = new Map(workflows.map((wf) => [wf.id, wf]));
    console.log(useStore.getState().pendingUpdates);
    const updated = Array.from(useStore.getState().pendingUpdates)
      .map((id) => workflowMap.get(id))
      .filter((wf): wf is WorkflowDefinition => wf !== undefined);
    const pendingDeletes = useStore.getState().pendingDeletes;
    const deleted = Object.entries(pendingDeletes).map(([id, deletedAt]) => ({
      id,
      deletedAt,
    }));
    if (updated.length === 0 && deleted.length === 0) {
      return;
    }
    await this.client.pushWorkflows(updated, deleted);
    useStore.getState().clearPendingUpdates();
    useStore.getState().clearPendingDeletes();
  }

  private async performSync(): Promise<void> {
    await this.pull();
    await this.push();
  }

  static async triggerSync(): Promise<void> {
    return await sendMessageToBackground("SYNC_WORKFLOWS");
  }

  static async triggerThrottledSync(): Promise<void> {
    return await sendMessageToBackground("SYNC_WORKFLOWS_THROTTLED");
  }
}
