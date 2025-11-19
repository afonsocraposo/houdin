import { getRelativeTime } from "@/lib/time";
import { ContentStorageClient } from "@/services/storage";
import { StorageKeys } from "@/services/storage-keys";
import { WorkflowSyncer } from "@/services/workflowSyncer";
import { ActionIcon, Group, Loader, Text, Tooltip } from "@mantine/core";
import { IconCheck, IconRefresh, IconAlertCircle } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type SyncStatus = "idle" | "syncing" | "success" | "error";

export default function SyncButton() {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const storageClient = useMemo(() => new ContentStorageClient(), []);

  const loadLastSynced = useCallback(async () => {
    const date = await storageClient.getLastSynced();
    if (date) {
      setLastSynced(new Date(date));
    }
  }, [storageClient]);

  const syncWorkflows = useCallback(async () => {
    try {
      await WorkflowSyncer.triggerSync();
    } catch (error) {
      console.error("Manual sync failed:", error);
    }
  }, []);

  const throttledSyncWorkflows = useCallback(async () => {
    const isSyncing = await storageClient.isSyncInProgress();

    if (isSyncing) {
      setStatus("syncing");
      return;
    }

    try {
      await WorkflowSyncer.triggerThrottledSync();
    } catch (error) {
      console.error("Throttled sync failed:", error);
    }
  }, [storageClient]);

  useEffect(() => {
    loadLastSynced();

    const unsubscribeSyncLock = storageClient.addListener(
      StorageKeys.SYNC_IN_PROGRESS,
      async (lockData) => {
        if (lockData) {
          setStatus("syncing");
        } else {
          const result = await storageClient.getSyncResult();
          await loadLastSynced();

          if (result && !result.success) {
            console.error("Sync failed:", result.error);
            setStatus("error");
            setTimeout(() => setStatus("idle"), 3000);
          } else {
            setStatus("success");
            setTimeout(() => setStatus("idle"), 2000);
          }
        }
      },
    );

    const unsubscribeSyncResult = storageClient.addListener(
      StorageKeys.SYNC_RESULT,
      async (result) => {
        if (result && !result.success) {
          console.error("Sync failed:", result.error);
          setStatus("error");
          setTimeout(() => setStatus("idle"), 3000);
        }
      },
    );

    throttledSyncWorkflows();

    return () => {
      unsubscribeSyncLock();
      unsubscribeSyncResult();
    };
  }, [storageClient, loadLastSynced, throttledSyncWorkflows]);

  const getIcon = () => {
    switch (status) {
      case "syncing":
        return <Loader size={16} />;
      case "success":
        return <IconCheck size={16} />;
      case "error":
        return <IconAlertCircle size={16} />;
      default:
        return <IconRefresh size={16} />;
    }
  };

  const getColor = () => {
    switch (status) {
      case "success":
        return "teal";
      case "error":
        return "red";
      default:
        return "gray";
    }
  };

  const getTooltip = () => {
    switch (status) {
      case "syncing":
        return "Syncing workflows...";
      case "success":
        return "Sync successful";
      case "error":
        return "Sync failed. Click to retry.";
      default:
        return lastSynced
          ? `Last synced: ${lastSynced.toLocaleString()}`
          : "Never synced. Click to sync.";
    }
  };

  return (
    <Group gap="xs">
      <Text size="xs" c="dimmed">
        {lastSynced ? getRelativeTime(lastSynced) : "Never synced"}
      </Text>
      <Tooltip label={getTooltip()} position="bottom">
        <ActionIcon
          onClick={syncWorkflows}
          disabled={status === "syncing"}
          color={getColor()}
          variant={status === "idle" ? "subtle" : "light"}
        >
          {getIcon()}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
