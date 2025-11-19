import { ApiClient } from "@/api/client";
import { BackgroundStorageClient } from "./storage";
import browser from "./browser";

export class WorkflowSyncer {
  static instance: WorkflowSyncer = new WorkflowSyncer();
  private static syncPromise: Promise<void> | null = null;
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
        console.debug("Received SYNC_WORKFLOWS message, starting sync...");
        this.syncWorkflows().catch((error) => {
          console.error("Error during workflow sync:", error);
        });
      }
    });
  }

  async syncWorkflows(): Promise<void> {
    if (WorkflowSyncer.syncPromise) {
      console.debug("Sync already in progress, waiting for completion");
      return WorkflowSyncer.syncPromise;
    }

    WorkflowSyncer.syncPromise = this.performSync();
    
    try {
      await WorkflowSyncer.syncPromise;
    } finally {
      WorkflowSyncer.syncPromise = null;
    }
  }

  private async performSync(): Promise<void> {
    try {
      const lastSync = await this.storage.getLastSynced();
      const currentTimestamp = Date.now();

      const remoteWorkflows = await this.client.listWorkflows(lastSync);
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
    } catch (error) {
      console.error("Failed to sync workflows:", error);
    }
  }
}
