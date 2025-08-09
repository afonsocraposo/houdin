import { Text, Badge, Group, Card, Stack, ScrollArea } from "@mantine/core";
import { IconCheck, IconClock } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { StorageManager } from "../services/storage";
import { WorkflowDefinition } from "../types/workflow";

interface ActiveWorkflowsProps {
  currentUrl: string;
}

function ActiveWorkflows({ currentUrl }: ActiveWorkflowsProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const storageManager = StorageManager.getInstance();
      const allWorkflows = await storageManager.getWorkflows();
      setWorkflows(allWorkflows);
    } catch (error) {
      console.error("Error loading workflows:", error);
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

  const activeWorkflows = getActiveWorkflows();

  return (
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
              <Card key={workflow.id} padding="xs" withBorder>
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
  );
}

export default ActiveWorkflows;