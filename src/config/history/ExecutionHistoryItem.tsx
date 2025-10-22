import { NodeExecutionResult } from "@/types/workflow";
import {
  ActionIcon,
  Badge,
  Box,
  Popover,
  ScrollArea,
  Table,
  Text,
} from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import { IconSettings } from "@tabler/icons-react";
import { getStatusColor } from "./utils";

export default function ExecutionHistoryItem({
  node,
}: {
  node: NodeExecutionResult;
}) {
  const success = node.data && node.status === "success";
  return (
    <Table.Tr>
      <Table.Td>
        <Text size="xs" ff="monospace">
          {node.nodeId}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="blue">
          {node.nodeName}
        </Text>
      </Table.Td>
      <Table.Td ta="center">
        <Badge size="xs" color={getStatusColor(node.status)}>
          {node.status}
        </Badge>
      </Table.Td>
      <Table.Td ta="center">
        <Text size="xs">{node.duration ? `${node.duration}ms` : "-"}</Text>
      </Table.Td>
      <Table.Td style={{ width: 300 }}>
        {node.data && (
          <details open={!success}>
            <summary
              style={{
                cursor: "pointer",
                fontSize: "11px",
                color: "var(--mantine-color-blue-6)",
              }}
            >
              View Output
            </summary>
            <Box
              my={8}
              style={{
                overflow: "hidden",
                borderRadius: 8,
              }}
              w={300}
              display="flex"
              mah={200}
            >
              <ScrollArea w="100%" type="hover">
                <CodeHighlight
                  language="json"
                  code={
                    typeof node.data === "object"
                      ? JSON.stringify(node.data, null, 2)
                      : String(node.data)
                  }
                />
              </ScrollArea>
            </Box>
          </details>
        )}
      </Table.Td>
      <Table.Td ta="center">
        <Popover withArrow shadow="md">
          <Popover.Target>
            <ActionIcon variant="subtle">
              <IconSettings size="20" />
            </ActionIcon>
          </Popover.Target>
          <Popover.Dropdown maw={400}>
            <CodeHighlight
              language="json"
              code={JSON.stringify(node.nodeConfig, null, 2)}
            />
          </Popover.Dropdown>
        </Popover>
      </Table.Td>
    </Table.Tr>
  );
}
