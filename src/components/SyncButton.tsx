import { sendMessageToBackground } from "@/lib/messages";
import { ContentStorageClient } from "@/services/storage";
import { ActionIcon, Group, Loader, Text } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function SyncButton() {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  const storageClient = useMemo(() => new ContentStorageClient(), []);
  const syncWorkflows = useCallback(async () => {
    setSyncing(true);
    await sendMessageToBackground("SYNC_WORKFLOWS");
    const date = await storageClient.getLastSynced();
    if (date) {
      setLastSynced(new Date(date));
    }
    setSyncing(false);
  }, [storageClient]);
  useEffect(() => {
    storageClient.getLastSynced().then((date) => {
      if (date) {
        setLastSynced(new Date(date));
      }
      syncWorkflows();
    });
  }, []);
  return (
    <Group>
      <ActionIcon onClick={syncWorkflows} disabled={syncing}>
        {syncing ? <Loader size={16} /> : <IconRefresh />}
      </ActionIcon>
      <Text size="xs" color="dimmed">
        {lastSynced
          ? `Last Synced: ${lastSynced.toLocaleString()}`
          : "Never Synced"}
      </Text>
    </Group>
  );
}
