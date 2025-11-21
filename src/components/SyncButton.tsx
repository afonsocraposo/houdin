import { useSessionStore, useStore } from "@/store";
import { getRelativeTime } from "@/lib/time";
import { WorkflowSyncer } from "@/services/workflowSyncer";
import { ActionIcon, Group, Loader, Text, Tooltip } from "@mantine/core";
import { IconCheck, IconRefresh, IconAlertCircle } from "@tabler/icons-react";
import { useCallback, useMemo } from "react";

export default function SyncButton() {
  const account = useSessionStore((state) => state.account);
  const lastSynced = useStore((state) => state.lastSynced);
  const status = useStore((state) => state.status);

  const canSync = useMemo(() => account && account.plan !== "free", [account]);

  const syncWorkflows = useCallback(async () => {
    try {
      await WorkflowSyncer.triggerSync();
    } catch (error) {
      console.error("Manual sync failed:", error);
    }
  }, []);

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
    if (!canSync) {
      return "Upgrade your plan to enable workflow synchronization.";
    }
    switch (status) {
      case "syncing":
        return "Syncing workflows...";
      case "success":
        return "Sync successful";
      case "error":
        return "Sync failed. Click to retry.";
      default:
        return lastSynced
          ? `Last synced: ${new Date(lastSynced).toLocaleString()}`
          : "Never synced. Click to sync.";
    }
  };

  return (
    <Group gap="xs">
      <Text size="xs" c="dimmed">
        {lastSynced ? getRelativeTime(new Date(lastSynced)) : "Never synced"}
      </Text>
      <Tooltip label={getTooltip()} position="bottom">
        <ActionIcon
          onClick={syncWorkflows}
          disabled={status === "syncing" || !canSync}
          color={getColor()}
          variant={status === "idle" ? "subtle" : "light"}
        >
          {getIcon()}
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
