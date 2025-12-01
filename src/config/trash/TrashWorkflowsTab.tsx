import {
  Card,
  Group,
  Stack,
  Table,
  Text,
  Title,
  LoadingOverlay,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import { IconRefresh, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import TrashWorkflowItem from "./TrashWorkflowItem";
import { DeletedWorkflow } from "@/api/schemas/types";
import { ApiClient } from "@/api/client";
import { useSessionStore } from "@/store";

export default function TrashWorkflowsTab() {
  const [workflows, setWorkflows] = useState<DeletedWorkflow[]>([]);
  const [loading, setLoading] = useState(false);
  const account = useSessionStore((state) => state.account);
  useEffect(() => {
    fetchWorkflows();
  }, []);
  const fetchWorkflows = async () => {
    if (!account || account.plan === "free") {
      return;
    }
    setLoading(true);
    const client = new ApiClient();
    const deleted = await client.listDeletedWorkflows();
    setWorkflows(deleted);
    setLoading(false);
  };
  const handleRestoreWorkflow = async (workflowId: string) => {
    const client = new ApiClient();
    setLoading(true);
    try {
      await client.restoreDeletedWorkflow(workflowId);
      fetchWorkflows();
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteWorkflow = async (workflowId: string) => {
    const client = new ApiClient();
    setLoading(true);
    try {
      await client.permanentlyDeleteWorkflow(workflowId);
      fetchWorkflows();
    } finally {
      setLoading(false);
    }
  };
  return (
    <Card withBorder padding="lg" pos="relative">
      <LoadingOverlay visible={loading} loaderProps={{ type: "dots" }} />
      <Group mb="md">
        <Title order={3}>Trash</Title>
        <Tooltip label="Refresh" position="bottom">
          <ActionIcon
            onClick={fetchWorkflows}
            disabled={loading}
            variant="subtle"
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
        <Text c="dimmed" size="sm">
          Deleted workflows are kept for 30 days before permanent removal.
        </Text>
      </Group>

      {workflows.length === 0 ? (
        <Stack align="center" py="xl">
          <IconTrash size={64} color="gray" />
          <Text c="dimmed" ta="center">
            Your trash is empty.
          </Text>
        </Stack>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>URL Pattern</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th ta="center">Nodes</Table.Th>
              <Table.Th ta="center">Deleted</Table.Th>
              <Table.Th ta="center">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {workflows.map((workflow) => (
              <TrashWorkflowItem
                key={workflow.id}
                workflow={workflow}
                handleDeleteWorkflow={handleDeleteWorkflow}
                handleRestoreWorkflow={handleRestoreWorkflow}
              />
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}
