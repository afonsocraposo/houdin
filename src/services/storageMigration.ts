import browser from "./browser";
import { StorageKeys } from "./storage-keys";
import { useStore } from "@/store";

const MIGRATION_VERSION_KEY = "storage-migration-version";

export class StorageMigration {
  static async runMigrations(): Promise<void> {
    const currentVersion = await this.getCurrentMigrationVersion();

    if (currentVersion < 1) {
      await this.migrateToZustandStore();
      await this.setMigrationVersion(1);
    }
  }

  private static async getCurrentMigrationVersion(): Promise<number> {
    const result = await browser.storage.local.get([MIGRATION_VERSION_KEY]);
    return result[MIGRATION_VERSION_KEY] || 0;
  }

  private static async setMigrationVersion(version: number): Promise<void> {
    await browser.storage.local.set({ [MIGRATION_VERSION_KEY]: version });
  }

  private static async migrateToZustandStore(): Promise<void> {
    console.debug("Starting migration to Zustand store...");

    try {
      const oldData = await browser.storage.local.get([
        StorageKeys.WORKFLOWS,
        StorageKeys.LAST_SYNCED,
      ]);

      const workflows = oldData[StorageKeys.WORKFLOWS] || [];
      const lastSynced = oldData[StorageKeys.LAST_SYNCED] || null;

      console.debug("Found old storage data:", {
        workflowsCount: workflows.length,
        lastSynced,
      });

      const store = useStore.getState();

      if (workflows.length > 0 && store.setWorkflows) {
        store.setWorkflows(workflows);
        console.debug(
          `Migrated ${workflows.length} workflows to Zustand store`,
        );
      }

      if (lastSynced && store.setLastSynced) {
        store.setLastSynced(lastSynced);
        console.debug(`Migrated lastSynced timestamp: ${lastSynced}`);
      }

      await this.cleanupOldStorage();

      console.debug("Migration to Zustand store completed successfully");
    } catch (error) {
      console.error("Error during storage migration:", error);
      throw error;
    }
  }

  static async cleanupOldStorage(): Promise<void> {
    console.debug("Cleaning up old storage keys...");

    try {
      await browser.storage.local.remove([
        StorageKeys.WORKFLOWS,
        StorageKeys.LAST_SYNCED,
      ]);

      console.debug("Old storage keys cleaned up successfully");
    } catch (error) {
      console.error("Error cleaning up old storage:", error);
    }
  }
}
