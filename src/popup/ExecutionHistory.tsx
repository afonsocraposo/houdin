import { useState, useEffect } from "react";
import {
  Stack,
  Title,
  Text,
  Button,
  Card,
  Badge,
  Group,
  ScrollArea,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconPlayerPlay,
  IconHistory,
} from "@tabler/icons-react";
import { WorkflowExecution, WorkflowDefinition } from "../types/workflow";
import { StorageManager } from "../services/storage";

function ExecutionHistory() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);

  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;

  const loadExecutions = async () => {
    try {
      const response = await new Promise<{ executions: WorkflowExecution[] }>(
        (resolve) => {
          browserAPI.runtime.sendMessage({ type: "GET_EXECUTIONS" }, resolve);
        },
      );
      setExecutions(response.executions || []);
    } catch (error) {
      console.error("Failed to load executions:", error);
      setExecutions([]);
    }
  };

  const loadWorkflows = async () => {
    try {
      const storageManager = StorageManager.getInstance();
      const workflowList = await storageManager.getWorkflows();
      setWorkflows(workflowList);
    } catch (error) {
      console.error("Failed to load workflows:", error);
    }
  };

  useEffect(() => {
    loadExecutions();
    loadWorkflows();

    // Set up periodic refresh to get real-time updates
    const interval = setInterval(loadExecutions, 1000);
    return () => clearInterval(interval);
  }, []);

  const getWorkflowName = (workflowId: string): string => {
    const workflow = workflows.find((w) => w.id === workflowId);
    return workflow?.name || `Workflow ${workflowId.slice(-6)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IconCheck size={12} />;
      case "failed":
        return <IconX size={12} />;
      case "running":
        return <IconPlayerPlay size={12} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "green";
      case "failed":
        return "red";
      case "running":
        return "blue";
      default:
        return "gray";
    }
  };

  const clearHistory = async () => {
    try {
      browserAPI.runtime.sendMessage({ type: "EXECUTIONS_CLEARED" });
      setExecutions([]);
    } catch (error) {
      console.error("Failed to clear executions:", error);
    }
  };

  const openFullHistory = () => {
    // Open config page with executions tab
    const configUrl =
      browserAPI.runtime.getURL("src/config/index.html") + "#/executions";
    browserAPI.tabs.create({ url: configUrl });
  };

  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const getStats = () => {
    return {
      total: executions.length,
      running: executions.filter((e) => e.status === "running").length,
      completed: executions.filter((e) => e.status === "completed").length,
      failed: executions.filter((e) => e.status === "failed").length,
    };
  };

  // Get last 5 executions
  const recentExecutions = executions
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, 5);

  const stats = getStats();

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Title order={4}>Session Activity</Title>
        <Button size="xs" variant="light" onClick={clearHistory}>
          Clear
        </Button>
      </Group>

      <Group gap="xs">
        <Badge color="blue" variant="light" size="sm">
          {stats.total} executed
        </Badge>
        {stats.running > 0 && (
          <Badge color="blue" size="sm">
            {stats.running} running
          </Badge>
        )}
        {stats.completed > 0 && (
          <Badge color="green" size="sm">
            {stats.completed} completed
          </Badge>
        )}
        {stats.failed > 0 && (
          <Badge color="red" size="sm">
            {stats.failed} failed
          </Badge>
        )}
      </Group>

      {recentExecutions.length === 0 ? (
        <Card withBorder>
          <Text size="sm" c="dimmed" ta="center">
            No workflow executions in this session
          </Text>
        </Card>
      ) : (
        <Card withBorder p="sm">
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Recent Workflows:
            </Text>
            <ScrollArea h={120}>
              <Stack gap="xs">
                {recentExecutions.map((execution) => (
                  <Group key={execution.id} justify="space-between" gap="xs">
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text size="xs" truncate>
                        {getWorkflowName(execution.workflowId)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {getTimeAgo(execution.startedAt)}
                      </Text>
                    </Stack>
                    <Badge
                      size="xs"
                      color={getStatusColor(execution.status)}
                      leftSection={getStatusIcon(execution.status)}
                    >
                      {execution.status}
                    </Badge>
                  </Group>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>
        </Card>
      )}

      <Button
        size="xs"
        variant="light"
        leftSection={<IconHistory size={14} />}
        onClick={openFullHistory}
        fullWidth
      >
        View Full History
      </Button>
    </Stack>
  );
}

export default ExecutionHistory;
