import { Modal, Text, Badge, Group, Stack, Card, ScrollArea, Code, Accordion } from "@mantine/core";
import { IconCheck, IconX, IconClock, IconBolt } from "@tabler/icons-react";
import { WorkflowDefinition, WorkflowExecution } from "../types/workflow";

interface WorkflowDetailModalProps {
  opened: boolean;
  onClose: () => void;
  workflow: WorkflowDefinition | null;
  executions: WorkflowExecution[];
}

function WorkflowDetailModal({ opened, onClose, workflow, executions }: WorkflowDetailModalProps) {
  if (!workflow) return null;

  const lastExecution = executions.find(exec => exec.workflowId === workflow.id);
  
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A";
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
      case "completed":
        return <IconCheck size={14} />;
      case "error":
      case "failed":
        return <IconX size={14} />;
      case "running":
        return <IconBolt size={14} />;
      default:
        return <IconClock size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
      case "completed":
        return "green";
      case "error":
      case "failed":
        return "red";
      case "running":
        return "blue";
      default:
        return "gray";
    }
  };

  const getNodeName = (nodeId: string) => {
    const node = workflow.nodes.find(n => n.id === nodeId);
    return node?.data?.name || node?.data?.actionType || node?.data?.triggerType || nodeId;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Text fw={600}>{workflow.name}</Text>
          <Badge variant="light" color="blue">
            {workflow.nodes.length} nodes
          </Badge>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        {/* Workflow Info */}
        <Card withBorder>
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500}>Workflow Information</Text>
              <Badge variant="light" color={workflow.enabled ? "green" : "gray"}>
                {workflow.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </Group>
            
            <Text size="xs" c="dimmed">
              <strong>URL Pattern:</strong> {workflow.urlPattern}
            </Text>
            
            {workflow.description && (
              <Text size="xs" c="dimmed">
                <strong>Description:</strong> {workflow.description}
              </Text>
            )}
            
            <Group gap="md">
              <Text size="xs" c="dimmed">
                <strong>Last Updated:</strong> {workflow.lastUpdated ? formatTimestamp(workflow.lastUpdated) : "Never"}
              </Text>
              <Text size="xs" c="dimmed">
                <strong>Last Executed:</strong> {workflow.lastExecuted ? formatTimestamp(workflow.lastExecuted) : "Never"}
              </Text>
              <Text size="xs" c="dimmed">
                <strong>Executions:</strong> {workflow.executionCount || 0}
              </Text>
            </Group>
          </Stack>
        </Card>

        {/* Last Execution Details */}
        {lastExecution && (
          <Card withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Last Execution</Text>
                <Badge 
                  variant="light" 
                  color={getStatusColor(lastExecution.status)}
                  leftSection={getStatusIcon(lastExecution.status)}
                >
                  {lastExecution.status}
                </Badge>
              </Group>
              
              <Group gap="md">
                <Text size="xs" c="dimmed">
                  <strong>Started:</strong> {formatTimestamp(lastExecution.startedAt)}
                </Text>
                {lastExecution.completedAt && (
                  <Text size="xs" c="dimmed">
                    <strong>Duration:</strong> {formatDuration(lastExecution.completedAt - lastExecution.startedAt)}
                  </Text>
                )}
              </Group>

              {lastExecution.trigger && (
                <Text size="xs" c="dimmed">
                  <strong>Triggered by:</strong> {lastExecution.trigger.type}
                </Text>
              )}
            </Stack>
          </Card>
        )}

        {/* Node Execution Results */}
        {lastExecution && lastExecution.nodeResults.length > 0 && (
          <Card withBorder>
            <Stack gap="xs">
              <Text size="sm" fw={500}>Node Execution Results</Text>
              
              <ScrollArea h={300} type="auto">
                <Accordion variant="contained">
                  {lastExecution.nodeResults.map((result) => (
                    <Accordion.Item key={result.nodeId} value={result.nodeId}>
                      <Accordion.Control>
                        <Group justify="space-between" w="100%">
                          <Group gap="xs">
                            <Text size="sm">{getNodeName(result.nodeId)}</Text>
                            <Badge 
                              size="xs" 
                              variant="light" 
                              color={getStatusColor(result.status)}
                              leftSection={getStatusIcon(result.status)}
                            >
                              {result.status}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {formatDuration(result.duration)}
                          </Text>
                        </Group>
                      </Accordion.Control>
                      
                      <Accordion.Panel>
                        <Stack gap="xs">
                          <Text size="xs" c="dimmed">
                            <strong>Executed at:</strong> {formatTimestamp(result.executedAt)}
                          </Text>
                          
                          {result.output && (
                            <div>
                              <Text size="xs" fw={500} mb="xs">Output:</Text>
                              <Code block style={{ fontSize: "10px", maxHeight: "150px", overflow: "auto" }}>
                                {typeof result.output === "string" 
                                  ? result.output 
                                  : JSON.stringify(result.output, null, 2)
                                }
                              </Code>
                            </div>
                          )}
                          
                          {result.error && (
                            <div>
                              <Text size="xs" fw={500} mb="xs" c="red">Error:</Text>
                              <Code block c="red" style={{ fontSize: "10px" }}>
                                {result.error}
                              </Code>
                            </div>
                          )}
                        </Stack>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </ScrollArea>
            </Stack>
          </Card>
        )}

        {/* No Execution Data */}
        {!lastExecution && (
          <Card withBorder>
            <Text size="sm" c="dimmed" ta="center" py="md">
              No execution data available for this workflow
            </Text>
          </Card>
        )}
      </Stack>
    </Modal>
  );
}

export default WorkflowDetailModal;