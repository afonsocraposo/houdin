import { ApiClient } from "@/api/client";
import { BackgroundStorageClient } from "./storage";
import browser from "./browser";
import { sendMessageToBackground } from "@/lib/messages";

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
      await this.storage.setSyncResult(false, error.message);
      if (failQuiet) {
        console.debug("Sync skipped:", error.message);
        return;
      }
      throw error;
    }

    if (WorkflowSyncer.syncPromise) {
      return WorkflowSyncer.syncPromise;
    }

    const syncId = await this.storage.acquireSyncLock();
    if (!syncId) {
      return;
    }

    WorkflowSyncer.syncPromise = this.performSync();

    let _error;
    try {
      await WorkflowSyncer.syncPromise;
      await this.storage.setSyncResult(true);
    } catch (error) {
      console.error("Error during workflow sync:", error);
      await this.storage.setSyncResult(
        false,
        error instanceof Error ? error.message : String(error),
      );
      _error = error;
    } finally {
      WorkflowSyncer.syncPromise = null;
      await this.storage.releaseSyncLock();
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

  private async performSync(): Promise<void> {
    console.debug("Starting workflow sync process...");
    const lastSync = await this.storage.getLastSynced();
    const remoteWorkflows = await this.client.listWorkflows(lastSync);
    // UTC timestamp
    const currentTimestamp = Date.now();
    const localWorkflows = await this.storage.getWorkflows();

    const localWorkflowIds = new Set(localWorkflows.map((wf) => wf.id));
    const localWorkflowMap = new Map(localWorkflows.map((wf) => [wf.id, wf]));
    const remoteWorkflowIds = new Set(remoteWorkflows.map((wf) => wf.id));

    const allRemoteWorkflowIds = new Set(await this.client.listWorkflowsId());

    for (const localWorkflowId of localWorkflowIds) {
      const localWorkflow = localWorkflowMap.get(localWorkflowId);
      if (allRemoteWorkflowIds.has(localWorkflowId)) {
        continue;
      }
      if (
        localWorkflow &&
        localWorkflow.lastUpdated &&
        lastSync &&
        localWorkflow.lastUpdated < lastSync
      ) {
        console.debug(
          `Deleting local workflow missing on server: ${localWorkflowId}`,
        );
        await this.storage.deleteWorkflow(localWorkflowId);
      }
    }

    for (const remoteWorkflow of remoteWorkflows) {
      if (!localWorkflowMap.has(remoteWorkflow.id)) {
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
          console.debug(`Creating new workflow on server: ${localWorkflow.id}`);
          await this.client.createWorkflow(localWorkflow);
        }
      }
    }

    await this.storage.setLastSynced(currentTimestamp);
    console.debug("Workflow sync process completed successfully");
  }

  static async triggerSync(): Promise<void> {
    return await sendMessageToBackground("SYNC_WORKFLOWS");
  }

  static async triggerThrottledSync(): Promise<void> {
    return await sendMessageToBackground("SYNC_WORKFLOWS_THROTTLED");
  }
}
