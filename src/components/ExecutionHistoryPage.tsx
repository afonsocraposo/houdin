import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Stack,
  Card,
  Badge,
  Group,
  Text,
  Button,
  ScrollArea,
  Table,
  ActionIcon,
  Select,
  TextInput,
} from "@mantine/core";
import {
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconCheck,
  IconX,
  IconPlayerPlay,
  IconRefresh,
  IconTrash,
  IconSearch,
  IconArrowLeft,
} from "@tabler/icons-react";
import { WorkflowExecution, WorkflowDefinition } from "../types/workflow";
import { StorageManager } from "../services/storage";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { TimeAgoText } from "./TimeAgoText";
import { formatTimeAgo } from "../utils/time";

function ExecutionHistoryPage() {
  const navigate = useNavigate();
  const { workflowId: urlWorkflowId } = useParams<{ workflowId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [filteredExecutions, setFilteredExecutions] = useState<
    WorkflowExecution[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Get workflowId from URL params or query params
  const workflowId = urlWorkflowId || searchParams.get("workflow") || "";

  const loadExecutions = async () => {
    try {
      const storageManager = StorageManager.getInstance();
      const executions = (
        await storageManager.getWorkflowExecutions()
      ).reverse();
      setExecutions(executions);
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

    // Set up periodic refresh
    const interval = setInterval(loadExecutions, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = executions;

    // If workflowId is provided in URL, filter by that workflow only
    if (workflowId) {
      filtered = filtered.filter((e) => e.workflowId === workflowId);
    }

    if (statusFilter) {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.id.toLowerCase().includes(search) ||
          e.workflowId.toLowerCase().includes(search) ||
          e.triggerType.toLowerCase().includes(search),
      );
    }

    setFilteredExecutions(filtered);
  }, [executions, statusFilter, searchFilter, workflowId]);

  const toggleExpanded = (executionId: string) => {
    setExpanded((prev) =>
      prev.includes(executionId)
        ? prev.filter((id) => id !== executionId)
        : [...prev, executionId],
    );
  };

  const formatDuration = (execution: WorkflowExecution) => {
    if (!execution.completedAt) return "Running...";
    return `${execution.completedAt - execution.startedAt}ms`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "success":
        return "green";
      case "failed":
      case "error":
        return "red";
      case "running":
        return "blue";
      default:
        return "gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IconCheck size={16} />;
      case "failed":
        return <IconX size={16} />;
      case "running":
        return <IconPlayerPlay size={16} />;
      default:
        return <IconClock size={16} />;
    }
  };

  const clearHistory = async () => {
    try {
      const storageManager = StorageManager.getInstance();
      await storageManager.clearWorkflowExecutions();
      setExecutions([]);
      setFilteredExecutions([]);
    } catch (error) {
      console.error("Failed to clear executions:", error);
    }
  };

  const getStats = () => {
    return {
      total: filteredExecutions.length,
      completed: filteredExecutions.filter((e) => e.status === "completed")
        .length,
      failed: filteredExecutions.filter((e) => e.status === "failed").length,
    };
  };

  const getWorkflowName = (workflowId: string) => {
    const workflow = workflows.find((w) => w.id === workflowId);
    return workflow?.name || `Workflow ${workflowId.slice(-6)}`;
  };

  const getNodeType = (workflowId: string, nodeId: string): string => {
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return "unknown";

    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return "unknown";

    if (node.type === "action") {
      return `action:${node.data?.actionType || "unknown"}`;
    } else if (node.type === "trigger") {
      return `trigger:${node.data?.triggerType || "unknown"}`;
    }

    return node.type;
  };

  const stats = getStats();

  return (
    <Container size="xl" p="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>Execution history</Title>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => navigate("/")}
            >
              Back to Workflows
            </Button>

            <Button
              leftSection={<IconRefresh size={16} />}
              variant="light"
              onClick={loadExecutions}
            >
              Refresh
            </Button>
            <Button
              leftSection={<IconTrash size={16} />}
              color="red"
              variant="light"
              onClick={clearHistory}
            >
              Clear History
            </Button>
          </Group>
        </Group>

        <Text c="dimmed">
          Execution tracking - the last 50 executions are kept.
          {executions.length > 0 &&
            ` Found ${executions.length} total executions.`}
        </Text>

        {/* Statistics */}
        <Group gap="xs">
          <Badge color="blue" variant="light" size="lg">
            {stats.total} total
          </Badge>
          {stats.completed > 0 && (
            <Badge color="green" size="lg">
              {stats.completed} completed
            </Badge>
          )}
          {stats.failed > 0 && (
            <Badge color="red" size="lg">
              {stats.failed} failed
            </Badge>
          )}
        </Group>

        {/* Filters */}
        <Card withBorder p="md">
          <Group gap="md">
            <TextInput
              placeholder="Search executions..."
              leftSection={<IconSearch size={16} />}
              value={searchFilter}
              onChange={(event) => setSearchFilter(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by status"
              data={[
                { value: "", label: "All statuses" },
                { value: "completed", label: "Completed" },
                { value: "failed", label: "Failed" },
              ]}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || "")}
              style={{ minWidth: 150 }}
            />
            <Select
              placeholder="Filter by workflow"
              data={[
                { value: "", label: "All workflows" },
                ...workflows.map((w) => ({ value: w.id, label: w.name })),
              ]}
              value={workflowId}
              onChange={(value) => {
                const newSearchParams = new URLSearchParams(searchParams);
                if (value) {
                  newSearchParams.set("workflow", value);
                } else {
                  newSearchParams.delete("workflow");
                }
                setSearchParams(newSearchParams);
              }}
              style={{ minWidth: 200 }}
            />
          </Group>
        </Card>

        <ScrollArea>
          {/* Execution List */}
          {filteredExecutions.length === 0 ? (
            <Card withBorder>
              <Text size="sm" c="dimmed" ta="center" p="xl">
                {executions.length === 0
                  ? "No workflow executions in this session"
                  : "No executions match your filters"}
              </Text>
            </Card>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th></Table.Th>
                  <Table.Th>Execution ID</Table.Th>
                  <Table.Th>Workflow</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Trigger</Table.Th>
                  <Table.Th>Started</Table.Th>
                  <Table.Th>Duration</Table.Th>
                  <Table.Th>URL</Table.Th>
                  <Table.Th>Nodes</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredExecutions.map((execution) => (
                  <React.Fragment key={execution.id}>
                    <Table.Tr>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={() => toggleExpanded(execution.id)}
                        >
                          {expanded.includes(execution.id) ? (
                            <IconChevronDown size={16} />
                          ) : (
                            <IconChevronRight size={16} />
                          )}
                        </ActionIcon>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace">
                          {execution.id.slice(-8)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {getWorkflowName(execution.workflowId)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={getStatusColor(execution.status)}
                          size="sm"
                          leftSection={getStatusIcon(execution.status)}
                        >
                          {execution.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {execution.triggerType || "unknown"}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Stack gap={2}>
                          <TimeAgoText
                            timestamp={execution.startedAt}
                            size="sm"
                          />
                          <Text size="xs" c="dimmed">
                            {new Date(execution.startedAt).toLocaleDateString()}
                          </Text>
                        </Stack>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDuration(execution)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text
                          size="sm"
                          style={{ maxWidth: 200 }}
                          truncate
                          title={execution.url}
                        >
                          {execution.url}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{execution.nodeResults.length}</Text>
                      </Table.Td>
                    </Table.Tr>
                    {expanded.includes(execution.id) && (
                      <Table.Tr>
                        <Table.Td colSpan={9}>
                          <Card withBorder p="md" m="sm">
                            <Stack gap="sm">
                              <Title order={6}>Node Execution Results:</Title>
                              {execution.nodeResults.length === 0 ? (
                                <Stack gap="xs">
                                  <Text size="sm" c="dimmed">
                                    No node results recorded for this execution.
                                  </Text>
                                  <Text size="xs" c="dimmed">
                                    Debug info: Execution ID: {execution.id},
                                    Status: {execution.status}, Started:{" "}
                                    {formatTimeAgo(execution.startedAt)}
                                    {execution.completedAt &&
                                      `, Completed: ${formatTimeAgo(execution.completedAt)}`}
                                  </Text>
                                </Stack>
                              ) : (
                                <Table>
                                  <Table.Thead>
                                    <Table.Tr>
                                      <Table.Th>Node ID2</Table.Th>
                                      <Table.Th>Node Type</Table.Th>
                                      <Table.Th>Status</Table.Th>
                                      <Table.Th>Duration</Table.Th>
                                      <Table.Th>Output</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {execution.nodeResults
                                      .sort(
                                        (a, b) => a.executedAt - b.executedAt,
                                      )
                                      .map((node, i) => (
                                        <Table.Tr key={i}>
                                          <Table.Td>
                                            <Text size="xs" ff="monospace">
                                              {node.nodeId.slice(-8)}
                                            </Text>
                                          </Table.Td>
                                          <Table.Td>
                                            <Text size="xs" c="blue">
                                              {getNodeType(
                                                execution.workflowId,
                                                node.nodeId,
                                              )}
                                            </Text>
                                          </Table.Td>
                                          <Table.Td>
                                            <Badge
                                              size="xs"
                                              color={getStatusColor(
                                                node.status,
                                              )}
                                            >
                                              {node.status}
                                            </Badge>
                                          </Table.Td>
                                          <Table.Td>
                                            <Text size="xs">
                                              {node.duration
                                                ? `${node.duration}ms`
                                                : "-"}
                                            </Text>
                                          </Table.Td>
                                          <Table.Td style={{ width: 300 }}>
                                            {node.data &&
                                              (node.status === "success" ? (
                                                <details>
                                                  <summary
                                                    style={{
                                                      cursor: "pointer",
                                                      fontSize: "11px",
                                                      color:
                                                        "var(--mantine-color-blue-6)",
                                                    }}
                                                  >
                                                    View Output
                                                  </summary>
                                                  <pre
                                                    style={{
                                                      fontSize: "10px",
                                                      background:
                                                        "var(--mantine-color-gray-0)",
                                                      padding: "8px",
                                                      borderRadius: "4px",
                                                      marginTop: "4px",
                                                      maxHeight: "200px",
                                                      overflow: "auto",
                                                    }}
                                                  >
                                                    {typeof node.data ===
                                                    "object"
                                                      ? JSON.stringify(
                                                          node.data,
                                                          null,
                                                          2,
                                                        )
                                                      : String(node.data)}
                                                  </pre>
                                                </details>
                                              ) : (
                                                <Text
                                                  size="xs"
                                                  c="red"
                                                  truncate
                                                >
                                                  {JSON.stringify(node.data)}
                                                </Text>
                                              ))}
                                          </Table.Td>
                                        </Table.Tr>
                                      ))}
                                  </Table.Tbody>
                                </Table>
                              )}
                            </Stack>
                          </Card>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </React.Fragment>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>
      </Stack>
    </Container>
  );
}

export default ExecutionHistoryPage;
