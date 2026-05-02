import { useSessionStore } from "@/store";
import { ActionIcon, Group, Text, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import UpgradeModal from "./modals/upgradeModal";

export default function SyncButton() {
  const account = useSessionStore((state) => state.account);
  const [opened, { open, close }] = useDisclosure(false);

  const canSync = account && account.plan !== "free";

  const getTooltip = () => {
    return "Sync is managed automatically.";
  };

  if (account === null) {
    return null;
  }

  return (
    <>
      <Group gap="xs">
        <Tooltip label={getTooltip()} position="bottom">
          <ActionIcon
            onClick={canSync ? open : undefined}
            variant="subtle"
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
        {canSync && (
          <Text size="xs" c="dimmed">
            Auto-sync disabled
          </Text>
        )}
      </Group>
      <UpgradeModal opened={opened} onClose={close} />
    </>
  );
}
