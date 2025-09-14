import { useState, useEffect } from "react";
import {
  Stack,
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
import {
  WorkflowExecution,
  WorkflowDefinition,
  WorkflowExecutionStats,
} from "../types/workflow";
import { ContentStorageClient } from "../services/storage";
import { TimeAgoText } from "../components/TimeAgoText";

function ExecutionHistory() {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [stats, setStats] = useState<WorkflowExecutionStats>({
    total: 0,
    successful: 0,
    failed: 0,
  });

  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;
  const storageClient = new ContentStorageClient();

  const loadExecutions = async () => {
    try {
      const executions = await storageClient.getWorkflowExecutions(5);
      setExecutions(executions);
    } catch (error) {
      console.error("Failed to load executions:", error);
      setExecutions([]);
    }
  };

  const loadSessionStats = async () => {
    try {
      const stats = await storageClient.getSessionWorkflowExecutionStats();
      setStats(stats);
    } catch (error) {
      console.error("Failed to load session stats:", error);
    }
  };

  const loadWorkflows = async () => {
    try {
      const workflowList = await storageClient.getWorkflows();
      setWorkflows(workflowList);
    } catch (error) {
      console.error("Failed to load workflows:", error);
    }
  };

  useEffect(() => {
    loadExecutions();
    loadWorkflows();
    loadSessionStats();

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

  const openFullHistory = () => {
    // Open config page with executions tab
    const configUrl =
      browserAPI.runtime.getURL("src/config/index.html") + "#/executions";
    browserAPI.tabs.create({ url: configUrl });
  };

  const recentExecutions = executions.slice(0, stats.total);
  return (
    <Stack gap="sm" h={350}>
      <Group gap="xs">
        <Badge color="blue" variant="light" size="sm">
          {stats.total} executed
        </Badge>
        {stats.successful > 0 && (
          <Badge color="green" size="sm">
            {stats.successful} completed
          </Badge>
        )}
        {stats.failed > 0 && (
          <Badge color="red" size="sm">
            {stats.failed} failed
          </Badge>
        )}
      </Group>

      {recentExecutions.length === 0 ? (
        <Card flex={1} withBorder>
          <Text size="sm" c="dimmed" ta="center">
            No workflow executions in this session
          </Text>
        </Card>
      ) : (
        <Card flex={1} withBorder p="sm">
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Recent Workflows:
            </Text>
            <ScrollArea>
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
