import { ActionIcon, Badge, Group, Switch, Table, Text } from "@mantine/core";
import { WorkflowDefinition } from "@/types/workflow";
import {
  IconCopy,
  IconDownload,
  IconEdit,
  IconHistory,
  IconTrash,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

interface ConfigWorkflowItemProps {
  workflow: WorkflowDefinition;
  handleEditWorkflow: (workflow: WorkflowDefinition) => void;
  handleDeleteWorkflow: (workflowId: string) => void;
  handleDuplicateWorkflow: (workflow: WorkflowDefinition) => void;
  handleToggleWorkflow: (workflowId: string) => void;
  handleExportWorkflow: (workflow: WorkflowDefinition) => void;
}
export default function ConfigWorkflowItem({
  workflow,
  handleEditWorkflow,
  handleDeleteWorkflow,
  handleDuplicateWorkflow,
  handleToggleWorkflow,
  handleExportWorkflow,
}: ConfigWorkflowItemProps) {
  const navigate = useNavigate();
  return (
    <Table.Tr key={workflow.id}>
      <Table.Td>
        <Text fw={500}>{workflow.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed" style={{ fontFamily: "monospace" }}>
          {workflow.urlPattern || "No pattern set"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {workflow.description || "No description"}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light">{workflow.nodes.length} nodes</Badge>
      </Table.Td>
      <Table.Td>
        <Switch
          checked={workflow.enabled}
          onChange={() => handleToggleWorkflow(workflow.id)}
          size="sm"
        />
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            onClick={() => handleEditWorkflow(workflow)}
            title="Edit workflow"
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            onClick={() => handleDuplicateWorkflow(workflow)}
            title="Duplicate workflow"
          >
            <IconCopy size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => navigate(`/executions?workflow=${workflow.id}`)}
            title="View execution history"
          >
            <IconHistory size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => handleExportWorkflow(workflow)}
            title="Export workflow"
          >
            <IconDownload size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDeleteWorkflow(workflow.id)}
            title="Delete workflow"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
