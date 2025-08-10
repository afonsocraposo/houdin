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
  IconRefresh,
} from "@tabler/icons-react";
import { WorkflowExecution, WorkflowDefinition } from "../types/workflow";
import { StorageManager } from "../services/storage";
import { TimeAgoText } from "../components/TimeAgoText";

function ExecutionHistory() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;

  const loadExecutions = async () => {
    setIsRefreshing(true);
    try {
      const response = await new Promise<{ executions: WorkflowExecution[] }>(
        (resolve) => {
          browserAPI.runtime.sendMessage({ type: "GET_EXECUTIONS" }, resolve);
        },
      );
      setExecutions(response.executions || []);
      setLastRefresh(Date.now());
    } catch (error) {
      console.error("Failed to load executions:", error);
      setExecutions([]);
    } finally {
      setIsRefreshing(false);
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
    const interval = setInterval(loadExecutions, 5000); // Reduced frequency to 5 seconds
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

  const manualRefresh = () => {
    loadExecutions();
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
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            leftSection={<IconRefresh size={12} />}
            onClick={manualRefresh}
            loading={isRefreshing}
          >
            Refresh
          </Button>
          <Button size="xs" variant="light" onClick={clearHistory}>
            Clear
          </Button>
        </Group>
      </Group>

      {lastRefresh && (
        <TimeAgoText 
          timestamp={lastRefresh} 
          prefix="Last updated"
          size="xs" 
          c="dimmed" 
        />
      )}

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
        <Card mih={172} withBorder>
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
            <ScrollArea h={116}>
              <Stack gap="xs">
                {recentExecutions.map((execution) => (
                  <Group key={execution.id} justify="space-between" gap="xs">
                    <Stack gap={2} style={{ flex: 1 }}>
                      <Text size="xs" truncate>
                        {getWorkflowName(execution.workflowId)}
                      </Text>
                      <TimeAgoText 
                        timestamp={execution.startedAt}
                        size="xs" 
                        c="dimmed" 
                      />
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
