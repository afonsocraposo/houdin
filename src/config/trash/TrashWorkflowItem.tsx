import { ActionIcon, Badge, Group, Menu, Table, Text } from "@mantine/core";
import { IconDots, IconRestore, IconTrash } from "@tabler/icons-react";
import { DeletedWorkflow } from "@/api/schemas/types";
import { formatTimeAgo } from "@/lib/time";

interface Props {
  workflow: DeletedWorkflow;
  handleDeleteWorkflow: (workflowId: string) => Promise<void>;
  handleRestoreWorkflow: (workflowId: string) => Promise<void>;
}
export default function TrashWorkflowItem({
  workflow,
  handleRestoreWorkflow,
  handleDeleteWorkflow,
}: Props) {
  return (
    <Table.Tr key={workflow.id}>
      <Table.Td>
        <Text fw={500}>{workflow.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text
          size="sm"
          c="dimmed"
          style={{ fontFamily: "monospace" }}
          truncate
          maw={300}
          title={workflow.urlPattern}
        >
          {workflow.urlPattern || "No pattern set"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed" truncate maw={300}>
          {workflow.description || "No description"}
        </Text>
      </Table.Td>
      <Table.Td ta="center">
        <Badge variant="light">{workflow.nodes} nodes</Badge>
      </Table.Td>
      <Table.Td ta="center">
        {formatTimeAgo(new Date(workflow.deletedAt))}
      </Table.Td>
      <Table.Td ta="center">
        <Group gap="xs" wrap="nowrap" justify="center">
          <ActionIcon
            variant="subtle"
            onClick={() => handleRestoreWorkflow(workflow.id)}
            title="Restore Workflow"
          >
            <IconRestore size={16} />
          </ActionIcon>
          <Menu>
            <Menu.Target>
              <ActionIcon variant="subtle">
                <IconDots size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>Actions</Menu.Label>
              <Menu.Item
                leftSection={<IconTrash size={16} />}
                color="red"
                onClick={() => handleDeleteWorkflow(workflow.id)}
              >
                Permanently Delete Workflow
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
