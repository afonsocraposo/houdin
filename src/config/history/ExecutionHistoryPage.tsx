import React, { useEffect, useMemo, useState } from "react";
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
  IconTrash,
  IconSearch,
} from "@tabler/icons-react";
import { WorkflowExecution } from "@/types/workflow";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { TimeAgoText } from "@/components/TimeAgoText";
import ExecutionHistoryItem from "./ExecutionHistoryItem";
import { getStatusColor, getStatusIcon } from "./utils";
import { useStore } from "@/store";
import type { ConfigSearch } from "../router";

type SearchUpdater = (prev: ConfigSearch) => ConfigSearch;

function ExecutionHistoryPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as ConfigSearch;
  const executionId = search.execution;
  const workflowId = search.workflow;
  const [expanded, setExpanded] = useState<string[]>(
    executionId ? [executionId] : [],
  );
  const workflows = useStore((state) => state.workflows);
  const executions = useStore((state) => state.executions);
  const clearExecutions = useStore((state) => state.clearExecutions);
  const [filteredExecutions, setFilteredExecutions] = useState<
    WorkflowExecution[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>(executionId || "");
  const workflowNames = useMemo(
    () =>
      workflows.reduce(
        (acc, w) => ({ ...acc, [w.id]: w.name }),
        {} as Record<string, string>,
      ),
    [workflows],
  );

  useEffect(() => {
    let filtered = [...executions].reverse();

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
    clearExecutions();
    setFilteredExecutions([]);
  };

  const getStats = () => ({
    total: filteredExecutions.length,
    completed: filteredExecutions.filter((e) => e.status === "completed")
      .length,
    failed: filteredExecutions.filter((e) => e.status === "failed").length,
  });

  const getWorkflowName = (workflowId: string) => {
    return workflowNames[workflowId] || workflowId;
  };

  const stats = getStats();

  return (
    <Container size="xl" p="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack>
            <Title order={2}>Execution history</Title>
            <Text c="dimmed">Execution tracking is stored in app state.</Text>
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
            </Group>
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
                navigate({
                  to: "/",
                  search: ((prev: ConfigSearch) => ({
                    ...prev,
                    tab: "history",
                    workflow: value || undefined,
                  })) as SearchUpdater,
                });
              }}
              style={{ minWidth: 200 }}
            />
          </Group>
        </Card>

        <ScrollArea>
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
                    <Table.Tr>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          className="expander"
                          onClick={() => toggleExpanded(execution.id)}
                        >
                          {expanded.includes(execution.id) ? (
                            <IconChevronDown size={16} />
                          ) : (
                            <IconChevronRight size={16} />
                          )}
                        </ActionIcon>
                      </Table.Td>
                      <Table.Td>{execution.id}</Table.Td>
                      <Table.Td>
                        {getWorkflowName(execution.workflowId)}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={getStatusColor(execution.status)}
                          leftSection={getStatusIcon(execution.status)}
                        >
                          {execution.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{execution.triggerType}</Table.Td>
                      <Table.Td>
                        <TimeAgoText
                          timestamp={execution.startedAt}
                          size="sm"
                        />
                      </Table.Td>
                      <Table.Td>{formatDuration(execution)}</Table.Td>
                      <Table.Td>
                        <Text maw={300} truncate="end" title={execution.url}>
                          {execution.url}
                        </Text>
                      </Table.Td>
                      <Table.Td>{execution.nodeResults.length}</Table.Td>
                    </Table.Tr>
                    {expanded.includes(execution.id) && (
                      <Table.Tr>
                        <Table.Td colSpan={9}>
                          <ExecutionHistoryItem execution={execution} />
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
