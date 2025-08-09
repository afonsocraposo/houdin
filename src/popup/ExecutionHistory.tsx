import { useState, useEffect } from "react";
import { Stack, Title, Text, Button, Card, Badge, Group, ScrollArea, Collapse } from "@mantine/core";
import { IconChevronDown, IconChevronRight, IconClock, IconCheck, IconX, IconPlayerPlay } from "@tabler/icons-react";
import { WorkflowExecution, WorkflowDefinition } from "../types/workflow";
import { StorageManager } from "../services/storage";

function ExecutionHistory() {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);

  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;

  const loadExecutions = async () => {
    try {
      const response = await new Promise<{ executions: WorkflowExecution[] }>((resolve) => {
        browserAPI.runtime.sendMessage({ type: "GET_EXECUTIONS" }, resolve);
      });
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

  const getNodeType = (workflowId: string, nodeId: string): string => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return "unknown";
    
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) return "unknown";
    
    if (node.type === "action") {
      return `action:${node.data?.actionType || "unknown"}`;
    } else if (node.type === "trigger") {
      return `trigger:${node.data?.triggerType || "unknown"}`;
    }
    
    return node.type;
  };

  const toggleExpanded = (executionId: string) => {
    setExpanded(prev => 
      prev.includes(executionId) 
        ? prev.filter(id => id !== executionId)
        : [...prev, executionId]
    );
  };

  const formatDuration = (execution: WorkflowExecution) => {
    if (!execution.completedAt) return "Running...";
    return `${execution.completedAt - execution.startedAt}ms`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "green";
      case "failed": return "red";
      case "running": return "blue";
      default: return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <IconCheck size={16} />;
      case "failed": return <IconX size={16} />;
      case "running": return <IconPlayerPlay size={16} />;
      default: return <IconClock size={16} />;
    }
  };

  const clearHistory = async () => {
    try {
      browserAPI.runtime.sendMessage({ type: "EXECUTIONS_CLEARED" });
      setExecutions([]);
      setExpanded([]);
    } catch (error) {
      console.error("Failed to clear executions:", error);
    }
  };

  const getStats = () => {
    return {
      total: executions.length,
      running: executions.filter(e => e.status === "running").length,
      completed: executions.filter(e => e.status === "completed").length,
      failed: executions.filter(e => e.status === "failed").length,
    };
  };

  const stats = getStats();

  if (executions.length === 0) {
    return (
      <Card withBorder>
        <Text size="sm" c="dimmed" ta="center">
          No workflow executions in this session
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Title order={4}>Session Executions</Title>
        <Button size="xs" variant="light" onClick={clearHistory}>
          Clear
        </Button>
      </Group>

      <Group gap="xs">
        <Badge color="blue" variant="light" size="sm">
          {stats.total} total
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

      <ScrollArea style={{ maxHeight: "300px" }}>
        <Stack gap="xs">
          {executions.map((execution) => (
            <Card key={execution.id} withBorder p="sm">
              <Group
                justify="space-between"
                style={{ cursor: "pointer" }}
                onClick={() => toggleExpanded(execution.id)}
              >
                <Group gap="xs">
                  {expanded.includes(execution.id) ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronRight size={16} />
                  )}
                  <Text size="sm" fw={500} truncate style={{ maxWidth: "150px" }}>
                    Workflow {execution.workflowId.slice(-6)}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Badge
                    color={getStatusColor(execution.status)}
                    size="sm"
                    leftSection={getStatusIcon(execution.status)}
                  >
                    {execution.status}
                  </Badge>
                </Group>
              </Group>

              <Collapse in={expanded.includes(execution.id)}>
                <Stack gap="xs" mt="sm" pl="md">
                  <Text size="xs" c="dimmed">
                    Started: {new Date(execution.startedAt).toLocaleTimeString()}
                  </Text>
                  <Text size="xs" c="dimmed">
                    URL: {execution.url}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Duration: {formatDuration(execution)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Trigger: {execution.trigger.type}
                  </Text>
                  {execution.nodeResults.length > 0 && (
                    <Stack gap="xs">
                      <Text size="xs" fw={500}>Nodes:</Text>
                      {execution.nodeResults.map((node, i) => (
                        <Group key={i} gap="xs" pl="sm">
                          <Badge
                            size="xs"
                            color={getStatusColor(node.status)}
                          >
                            {node.status}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            {getNodeType(execution.workflowId, node.nodeId)}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {node.nodeId.slice(-6)} 
                            {node.duration && ` (${node.duration}ms)`}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </Collapse>
            </Card>
          ))}
        </Stack>
      </ScrollArea>
    </Stack>
  );
}

export default ExecutionHistory;