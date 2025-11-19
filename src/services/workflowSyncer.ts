import { ApiClient } from "@/api/client";
import { BackgroundStorageClient } from "./storage";
import browser from "./browser";

export class WorkflowSyncer {
  static instance: WorkflowSyncer = new WorkflowSyncer();
  private static syncPromise: Promise<void> | null = null;
  private static throttledSyncPromise: Promise<void> | null = null;
  private client: ApiClient;
  private storage: BackgroundStorageClient;

  constructor() {
    this.client = new ApiClient();
    this.storage = new BackgroundStorageClient();
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
        this.sync().catch((error) => {
          console.error("Error during workflow sync:", error);
        });
      } else if (message.type === "SYNC_WORKFLOWS_THROTTLED") {
        this.throttledSync().catch((error) => {
          console.error("Error during throttled workflow sync:", error);
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

  async sync(): Promise<void> {
    const canSync = await this.canUserSync();
    if (!canSync) {
      return;
    }

    if (WorkflowSyncer.syncPromise) {
      return WorkflowSyncer.syncPromise;
    }

    const syncId = await this.storage.acquireSyncLock();
    if (!syncId) {
      return;
    }

    WorkflowSyncer.syncPromise = this.performSync();

    try {
      await WorkflowSyncer.syncPromise;
    } finally {
      WorkflowSyncer.syncPromise = null;
      await this.storage.releaseSyncLock();
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

  private async performSync(): Promise<void> {
    console.debug("Starting workflow sync process...");
    try {
      const lastSync = await this.storage.getLastSynced();
      const remoteWorkflows = await this.client.listWorkflows(lastSync);
      // UTC timestamp
      const currentTimestamp = Date.now();
      const localWorkflows = await this.storage.getWorkflows();

      const localWorkflowIds = new Set(localWorkflows.map((wf) => wf.id));
      const localWorkflowMap = new Map(localWorkflows.map((wf) => [wf.id, wf]));
      const remoteWorkflowIds = new Set(remoteWorkflows.map((wf) => wf.id));

      const missingWorkflows =
        await this.client.listMissingWorkflowIds(localWorkflowIds);

      for (const missingId of missingWorkflows) {
        const localWorkflow = localWorkflowMap.get(missingId);
        if (
          localWorkflow &&
          localWorkflow.lastUpdated &&
          lastSync &&
          localWorkflow.lastUpdated < lastSync
        ) {
          console.debug(
            `Deleting local workflow missing on server: ${missingId}`,
          );
          await this.storage.deleteWorkflow(missingId);
        }
      }

      for (const remoteWorkflow of remoteWorkflows) {
        if (!localWorkflowMap.has(remoteWorkflow.id)) {
          console.log(remoteWorkflow.lastUpdated, lastSync);
          if (
            remoteWorkflow.lastUpdated &&
            lastSync &&
            remoteWorkflow.lastUpdated < lastSync
          ) {
            console.debug(
              `Deleting workflow from server (was deleted locally): ${remoteWorkflow.id}`,
            );
            await this.client.deleteWorkflow(remoteWorkflow.id);
          } else {
            console.debug(
              `Syncing new workflow from server: ${remoteWorkflow.id}`,
            );
            await this.storage.createWorkflow(remoteWorkflow);
          }
        } else {
          const localWorkflow = localWorkflowMap.get(remoteWorkflow.id);
          if (
            localWorkflow &&
            remoteWorkflow.lastUpdated &&
            localWorkflow.lastUpdated &&
            remoteWorkflow.lastUpdated > localWorkflow.lastUpdated
          ) {
            console.debug(
              `Updating local workflow from server: ${remoteWorkflow.id}`,
            );
            await this.storage.updateWorkflow(remoteWorkflow);
          } else if (
            localWorkflow &&
            localWorkflow.lastUpdated &&
            remoteWorkflow.lastUpdated &&
            localWorkflow.lastUpdated > remoteWorkflow.lastUpdated
          ) {
            console.debug(
              `Updating server workflow from local: ${remoteWorkflow.id}`,
            );
            await this.client.updateWorkflow(localWorkflow);
          }
        }
      }

      for (const localWorkflow of localWorkflows) {
        if (!remoteWorkflowIds.has(localWorkflow.id)) {
          if (
            localWorkflow.lastUpdated &&
            lastSync &&
            localWorkflow.lastUpdated > lastSync
          ) {
            console.debug(
              `Creating new workflow on server: ${localWorkflow.id}`,
            );
            await this.client.createWorkflow(localWorkflow);
          }
        }
      }

      await this.storage.setLastSynced(currentTimestamp);
      console.debug("Workflow sync process completed successfully");
    } catch (error) {
      console.error("Failed to sync workflows:", error);
    }
  }
}
