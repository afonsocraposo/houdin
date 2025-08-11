import { Text, Badge, Group, Card, Stack, ScrollArea } from "@mantine/core";
import { IconCheck, IconClock, IconHistory } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { StorageManager } from "../services/storage";
import { WorkflowDefinition, WorkflowExecution } from "../types/workflow";

interface ActiveWorkflowsProps {
  currentUrl: string;
}

function ActiveWorkflows({ currentUrl }: ActiveWorkflowsProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);

  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;

  useEffect(() => {
    loadData();
  }, []);

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

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load workflows and executions in parallel to avoid blocking
      const [workflows] = await Promise.all([
        (async () => {
          const storageManager = StorageManager.getInstance();
          return await storageManager.getWorkflows();
        })(),
        loadExecutions()
      ]);
      
      setWorkflows(workflows);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveWorkflows = () => {
    if (!currentUrl) return [];

    return workflows.filter((workflow) => {
      if (!workflow.enabled) return false;
      if (!workflow.urlPattern) return false;

      try {
        // Simple pattern matching - could be enhanced with regex
        const pattern = workflow.urlPattern.toLowerCase();
        const url = currentUrl.toLowerCase();

        // Check if pattern matches URL
        if (pattern.includes("*")) {
          // Handle wildcard patterns
          const regexPattern = pattern.replace(/\*/g, ".*");
          const regex = new RegExp(regexPattern);
          return regex.test(url);
        } else {
          // Simple string inclusion
          return url.includes(pattern);
        }
      } catch (error) {
        console.error("Error matching pattern:", error);
        return false;
      }
    });
  };

  const getWorkflowStatus = (workflow: WorkflowDefinition) => {
    const isActive = getActiveWorkflows().includes(workflow);
    if (!isActive) return "inactive";

    // Check if workflow has any running executions
    const runningExecution = executions.find(
      (exec) => exec.workflowId === workflow.id && exec.status === "running",
    );

    return runningExecution ? "running" : "ready";
  };

  const getLastExecutionTime = (workflow: WorkflowDefinition) => {
    const workflowExecutions = executions.filter(
      (exec) => exec.workflowId === workflow.id,
    );
    if (workflowExecutions.length === 0) return workflow.lastExecuted;

    // Get the most recent execution
    const latestExecution = workflowExecutions.sort(
      (a, b) => b.startedAt - a.startedAt,
    )[0];
    return latestExecution.startedAt;
  };

  const formatLastExecution = (timestamp?: number) => {
    if (!timestamp) return "Never";

    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const handleWorkflowClick = (workflow: WorkflowDefinition) => {
    // Open workflow designer in new tab
    const designerUrl = browserAPI.runtime.getURL(
      `src/config/index.html#/designer/${workflow.id}`,
    );
    browserAPI.tabs.create({ url: designerUrl });
    window.close();
  };

  const activeWorkflows = getActiveWorkflows();

  return (
    <>
      <div>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>
            Active Workflows
          </Text>
          <Badge
            size="sm"
            variant="light"
            color={activeWorkflows.length > 0 ? "green" : "gray"}
          >
            {activeWorkflows.length}
          </Badge>
        </Group>

        <ScrollArea h={180} type="auto">
          {loading ? (
            <Text size="xs" c="dimmed" ta="center" py="md">
              Loading workflows...
            </Text>
          ) : activeWorkflows.length > 0 ? (
            <Stack gap="xs">
              {activeWorkflows.map((workflow) => (
                <Card
                  key={workflow.id}
                  padding="xs"
                  withBorder
                  style={{ cursor: "pointer" }}
                  onClick={() => handleWorkflowClick(workflow)}
                >
                  <Group justify="space-between" gap="xs">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" fw={500} truncate>
                        {workflow.name}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {workflow.urlPattern}
                      </Text>
                      <Group gap="xs" mt={4}>
                        <Badge size="xs" variant="light" color="blue">
                          {workflow.nodes.length} nodes
                        </Badge>
                        <Badge
                          size="xs"
                          variant="light"
                          color={
                            getWorkflowStatus(workflow) === "ready"
                              ? "green"
                              : getWorkflowStatus(workflow) === "running"
                                ? "blue"
                                : "orange"
                          }
                          leftSection={
                            getWorkflowStatus(workflow) === "ready" ? (
                              <IconCheck size={10} />
                            ) : getWorkflowStatus(workflow) === "running" ? (
                              <IconClock size={10} />
                            ) : (
                              <IconClock size={10} />
                            )
                          }
                        >
                          {getWorkflowStatus(workflow) === "ready"
                            ? "Ready"
                            : getWorkflowStatus(workflow) === "running"
                              ? "Running"
                              : "Standby"}
                        </Badge>
                        {getLastExecutionTime(workflow) && (
                          <Badge
                            size="xs"
                            variant="light"
                            color="gray"
                            leftSection={<IconHistory size={10} />}
                          >
                            {formatLastExecution(
                              getLastExecutionTime(workflow),
                            )}
                          </Badge>
                        )}
                      </Group>
                    </div>
                  </Group>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text size="xs" c="dimmed" ta="center" py="md">
              No active workflows for this page
            </Text>
          )}
        </ScrollArea>
      </div>
    </>
  );
}

export default ActiveWorkflows;
