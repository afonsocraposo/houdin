import { Text, Badge, Group, Card, Stack, ScrollArea } from "@mantine/core";
import { IconCheck, IconClock, IconHistory } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { StorageManager } from "../services/storage";
import { WorkflowDefinition, WorkflowExecution } from "../types/workflow";
import WorkflowDetailModal from "./WorkflowDetailModal";

interface ActiveWorkflowsProps {
  currentUrl: string;
}

function ActiveWorkflows({ currentUrl }: ActiveWorkflowsProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const storageManager = StorageManager.getInstance();
      const [allWorkflows, allExecutions] = await Promise.all([
        storageManager.getWorkflows(),
        storageManager.getWorkflowExecutions()
      ]);
      setWorkflows(allWorkflows);
      setExecutions(allExecutions);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveWorkflows = () => {
    if (!currentUrl) return [];
    
    return workflows.filter(workflow => {
      if (!workflow.enabled) return false;
      if (!workflow.urlPattern) return false;
      
      try {
        // Simple pattern matching - could be enhanced with regex
        const pattern = workflow.urlPattern.toLowerCase();
        const url = currentUrl.toLowerCase();
        
        // Check if pattern matches URL
        if (pattern.includes('*')) {
          // Handle wildcard patterns
          const regexPattern = pattern.replace(/\*/g, '.*');
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
    // This would ideally come from the background script or content script
    // For now, we'll show it as "Ready" if it matches the current URL
    const isActive = getActiveWorkflows().includes(workflow);
    return isActive ? "ready" : "inactive";
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
    setSelectedWorkflow(workflow);
    setModalOpened(true);
  };

  const activeWorkflows = getActiveWorkflows();

  return (
    <>
      <div>
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={500}>
            Active Workflows
          </Text>
          <Badge size="sm" variant="light" color={activeWorkflows.length > 0 ? "green" : "gray"}>
            {activeWorkflows.length}
          </Badge>
        </Group>

        <ScrollArea h={120} type="auto">
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
                          color={getWorkflowStatus(workflow) === "ready" ? "green" : "orange"}
                          leftSection={
                            getWorkflowStatus(workflow) === "ready" ? 
                              <IconCheck size={10} /> : 
                              <IconClock size={10} />
                          }
                        >
                          {getWorkflowStatus(workflow) === "ready" ? "Ready" : "Standby"}
                        </Badge>
                        {workflow.lastExecuted && (
                          <Badge 
                            size="xs" 
                            variant="light" 
                            color="gray"
                            leftSection={<IconHistory size={10} />}
                          >
                            {formatLastExecution(workflow.lastExecuted)}
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

      <WorkflowDetailModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        workflow={selectedWorkflow}
        executions={executions}
      />
    </>
  );
}

export default ActiveWorkflows;