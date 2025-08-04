import {
  ActionIcon,
  CopyButton,
  FloatingPosition,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";

export default function CopyToClipboardButton({
  value,
  icon,
  tooltip = "Copied",
  tooltipPosition,
}: {
  value: string;
  icon?: React.ReactNode;
  tooltip?: string;
  tooltipPosition?: FloatingPosition;
}) {
  return (
    <CopyButton value={value}>
      {({ copied, copy }) => (
        <Tooltip
          label={<Text size="xs">{tooltip}</Text>}
          opened={copied}
          position={tooltipPosition}
          disabled={!tooltip}
        >
          <ActionIcon variant="subtle" onClick={copy}>
            {copied ? (
              <IconCheck size={16} color="green" />
            ) : (
              icon || <IconCopy size={16} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  );
}
