import {
  Box,
  Collapse,
  Group,
  Paper,
  rem,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import {
  IconAlertCircle,
  IconChevronDown,
  IconCheck,
  IconClockHour4,
  IconPlayerPause,
  IconTool,
} from "@tabler/icons-react";
import { useState } from "react";
import { useStore } from "@/store";

type ToolInvocationCardProps = {
  part: {
    type: string;
    toolCallId?: string;
    state?: string;
    input?: unknown;
    rawInput?: unknown;
    output?: unknown;
    errorText?: string;
  };
};

type ToolStateMeta = {
  label: string;
  color: string;
  icon: typeof IconTool;
};

function getToolName(type: string) {
  return type
    .replace(/^tool-/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

function getStateMeta(state?: string): ToolStateMeta {
  switch (state) {
    case "output-available":
      return { label: "Success", color: "green", icon: IconCheck };
    case "output-error":
      return { label: "Error", color: "red", icon: IconAlertCircle };
    case "approval-requested":
    case "approval-responded":
      return {
        label: "Needs Approval",
        color: "yellow",
        icon: IconPlayerPause,
      };
    case "input-available":
    case "input-streaming":
    default:
      return { label: "Running", color: "blue", icon: IconClockHour4 };
  }
}

function formatJson(value: unknown) {
  if (value === undefined) {
    return null;
  }

  return JSON.stringify(value, null, 2);
}

export default function ToolInvocationCard({ part }: ToolInvocationCardProps) {
  const expandTools = useStore(
    (state) => state.settings.workfowGeneration.expandTools,
  );
  const [opened, setOpened] = useState(
    part.state === "output-error" || expandTools,
  );
  const toolName = getToolName(part.type);
  const stateMeta = getStateMeta(part.state);
  const StateIcon = stateMeta.icon;
  const inputValue = part.input ?? part.rawInput;
  const inputJson = formatJson(inputValue);
  const outputJson = formatJson(part.output);
  const showOutput = Boolean(outputJson && outputJson !== inputJson);
  const showInput = Boolean(inputJson);
  const hasDetails = showInput || showOutput || Boolean(part.errorText);
  const codeStyles = {
    code: { fontSize: rem(11), lineHeight: 1.45 },
    pre: { fontSize: rem(11), lineHeight: 1.45 },
  } as const;

  return (
    <Paper
      withBorder
      radius="md"
      p={8}
      w="100%"
      bg="var(--mantine-color-dark-6)"
    >
      <Stack gap={6}>
        <UnstyledButton
          onClick={() => hasDetails && setOpened((current) => !current)}
          style={{ cursor: hasDetails ? "pointer" : "default" }}
        >
          <Group justify="space-between" align="center" gap="xs" wrap="nowrap">
            <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
              <IconTool size={12} />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" lh={1.2} truncate>
                    {toolName}
                  </Text>
                </Group>
              </Box>
            </Group>
            <Group gap={6} wrap="nowrap">
              <ThemeIcon
                size={20}
                variant="light"
                color={stateMeta.color}
                radius="xl"
              >
                <StateIcon size={12} />
              </ThemeIcon>
              {hasDetails ? (
                <IconChevronDown
                  size={14}
                  style={{
                    flex: "none",
                    transition: "transform 150ms ease",
                    transform: opened ? "rotate(180deg)" : undefined,
                  }}
                />
              ) : null}
            </Group>
          </Group>
        </UnstyledButton>

        <Collapse in={opened && hasDetails}>
          <Stack gap={6} pt={2}>
            {showInput ? (
              <Box>
                <Text size="10px" c="dimmed" mb={4} tt="uppercase" fw={700}>
                  Input
                </Text>
                <CodeHighlight
                  code={inputJson!}
                  language="json"
                  styles={codeStyles}
                />
              </Box>
            ) : null}

            {showOutput ? (
              <Box>
                <Text size="10px" c="dimmed" mb={4} tt="uppercase" fw={700}>
                  Output
                </Text>
                <CodeHighlight
                  code={outputJson!}
                  language="json"
                  styles={codeStyles}
                />
              </Box>
            ) : null}

            {part.errorText ? (
              <Box>
                <Text size="10px" c="red.2" mb={4} tt="uppercase" fw={700}>
                  Error
                </Text>
                <Text size="xs" c="red.1" style={{ whiteSpace: "pre-wrap" }}>
                  {part.errorText}
                </Text>
              </Box>
            ) : null}
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  );
}
