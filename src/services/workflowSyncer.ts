import { ApiClient } from "@/api/client";
import browser from "./browser";
import { sendMessageToBackground } from "@/lib/messages";
import { useStore } from "@/store";
import { WorkflowDefinition } from "@/types/workflow";

export class WorkflowSyncer {
  static instance: WorkflowSyncer = new WorkflowSyncer();
  private static syncPromise: Promise<void> | null = null;
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
      });
      if (failQuiet) {
        console.debug("Sync skipped:", error.message);
        return;
      }
      throw error;
    }

    if (WorkflowSyncer.syncPromise) {
      return WorkflowSyncer.syncPromise;
    }

    WorkflowSyncer.syncPromise = this.performSync();

    const TIMEOUT_MS = 15000;
    const failsafeTimeout = setTimeout(() => {
      console.warn("Sync took longer than 15 seconds, resetting sync state");
      useStore.getState().setSyncResult({
        success: false,
        error: "Sync operation timed out.",
      });
    }, TIMEOUT_MS);

    try {
      useStore.getState().startSync();
      await WorkflowSyncer.syncPromise;
      useStore.getState().setSyncResult({ success: true });
    } catch (error) {
      console.error("Error during workflow sync:", error);
      useStore.getState().setSyncResult({
        success: false,
        error: (error as Error).message,
      });
    } finally {
      WorkflowSyncer.syncPromise = null;
      clearTimeout(failsafeTimeout);
    }
  }

  async throttledSync(): Promise<void> {
    await this.sync();
  }

  private async pull(): Promise<void> {
    const lastServerTime = useStore.getState().lastServerTime;
    const { updated, deleted, serverTime } =
      await this.client.pullWorkflows(lastServerTime);
    const workflows = useStore.getState().workflows;
    const workflowsMap = new Map(workflows.map((wf) => [wf.id, wf]));
    const tombstones = useStore.getState().tombstones;
    const tombstonesMap = new Map(tombstones.map((t) => [t.id, t]));

    for (const workflow of updated) {
      const tombstone = tombstonesMap.get(workflow.id);
      if (tombstone && workflow.modifiedAt <= tombstone.deletedAt) {
        // Skip applying this update since we have a newer tombstone
        continue;
      }

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
}
