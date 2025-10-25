import { Text, Badge, Group, Stack, ScrollArea } from "@mantine/core";
import { useState, useEffect } from "react";
import { ContentStorageClient } from "@/services/storage";
import { WorkflowDefinition } from "@/types/workflow";
import ActiveWorkflowItem from "./ActiveWorkflowItem";

interface ActiveWorkflowsProps {
  currentUrl: string;
}

function ActiveWorkflows({ currentUrl }: ActiveWorkflowsProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Cross-browser API compatibility
  const storageClient = new ContentStorageClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const workflows = await storageClient.getWorkflows();
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
                <ActiveWorkflowItem key={workflow.id} workflow={workflow} />
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
