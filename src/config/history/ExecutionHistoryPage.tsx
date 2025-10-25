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
  IconX,
  IconRefresh,
  IconTrash,
  IconSearch,
} from "@tabler/icons-react";
import { WorkflowExecution, WorkflowDefinition } from "@/types/workflow";
import {
  ContentStorageClient,
  MAX_EXECUTIONS_HISTORY,
} from "@/services/storage";
import { useSearchParams } from "react-router-dom";
import { TimeAgoText } from "@/components/TimeAgoText";
import { formatTimeAgo } from "@/utils/time";
import ExecutionHistoryItem from "./ExecutionHistoryItem";
import { getStatusColor, getStatusIcon } from "./utils";

function ExecutionHistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const executionId = searchParams.get("execution");
  const workflowId = searchParams.get("workflow");
  const [expanded, setExpanded] = useState<string[]>(
    executionId ? [executionId] : [],
  );
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [filteredExecutions, setFilteredExecutions] = useState<
    WorkflowExecution[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>(executionId || "");

  const storageClient = new ContentStorageClient();

  const loadExecutions = async () => {
    try {
      const executions = await storageClient.getWorkflowExecutions();
      setExecutions(executions);
    } catch (error) {
      console.error("Failed to load executions:", error);
      setExecutions([]);
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

    // Set up periodic refresh
    const interval = setInterval(loadExecutions, 2000);
    return () => clearInterval(interval);
  }, [executionId, workflowId]);

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

  const clearHistory = async () => {
    try {
      await storageClient.clearWorkflowExecutions();
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
    return workflow?.name || `Workflow ${workflowId}`;
  };

  const stats = getStats();

  return (
    <Container size="xl" p="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack>
            <Title order={2}>Execution history</Title>
            <Text c="dimmed">
              Execution tracking - only the last {MAX_EXECUTIONS_HISTORY}{" "}
              executions are kept.
            </Text>
          </Stack>
          <Stack align="end" gap="lg">
            <Group>
              <Button
                leftSection={<IconTrash size={16} />}
                color="red"
                variant="outline"
                onClick={clearHistory}
              >
                Clear History
              </Button>
              <Button
                leftSection={<IconRefresh size={16} />}
                variant="light"
                onClick={loadExecutions}
              >
                Refresh
              </Button>
            </Group>
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
          </Stack>
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
              rightSection={
                searchFilter && (
                  <ActionIcon
                    size="sm"
                    onClick={() => setSearchFilter("")}
                    title="Clear search"
                    variant="subtle"
                  >
                    <IconX size={16} />
                  </ActionIcon>
                )
              }
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
                  ? "No executions yet"
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
                    <Table.Tr id={execution.id}>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={() => toggleExpanded(execution.id)}
                          className="expander"
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
                          {execution.id}
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
                                      <Table.Th>Node ID</Table.Th>
                                      <Table.Th>Node Type</Table.Th>
                                      <Table.Th ta="center">Status</Table.Th>
                                      <Table.Th ta="center">Duration</Table.Th>
                                      <Table.Th>Output</Table.Th>
                                      <Table.Th ta="center">Config</Table.Th>
                                    </Table.Tr>
                                  </Table.Thead>
                                  <Table.Tbody>
                                    {execution.nodeResults
                                      .sort(
                                        (a, b) => a.executedAt - b.executedAt,
                                      )
                                      .map((node, i) => (
                                        <ExecutionHistoryItem
                                          key={i}
                                          node={node}
                                        />
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
