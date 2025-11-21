import { ContentStorageClient } from "@/services/storage";
import { ExampleService } from "@/services/exampleService";
import { WorkflowDefinition } from "@/types/workflow";
import {
  Button,
  Card,
  Group,
  Stack,
  Table,
  Text,
  Title,
  Menu,
  LoadingOverlay,
} from "@mantine/core";
import {
  IconNetwork,
  IconPlus,
  IconUpload,
  IconChevronDown,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImportModal } from "./ImportModal";
import ConfigWorkflowItem from "./ConfigWorkflowItem";
import { ExportModal } from "./ExportModal";
import { newWorkflowId } from "@/utils/helpers";
import { WorkflowSyncer } from "@/services/workflowSyncer";
import { useStore } from "@/store";

export default function WorkflowsTab({
  setSaved,
}: {
  setSaved: (saved: boolean) => void;
}) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [exportModalOpened, setExportModalOpened] = useState(false);
  const [workflowToExport, setWorkflowToExport] =
    useState<WorkflowDefinition | null>(null);

  const isSyncing = useStore((state) => state.isSyncing);

  const storageClient = useMemo(() => new ContentStorageClient(), []);
  const exampleService = useMemo(() => new ExampleService(), []);

  const navigate = useNavigate();

  useEffect(() => {
    // Load existing workflows from storage using storage
    const loadData = async () => {
      try {
        const loadedWorkflows = await storageClient.getWorkflows();
        setWorkflows(loadedWorkflows);
      } catch (error) {
        console.error("Failed to load workflows:", error);
      }
    };

    loadData();

    // Set up storage change listener
    const handleStorageChange = (updatedWorkflows: WorkflowDefinition[]) => {
      setWorkflows(updatedWorkflows);
      WorkflowSyncer.triggerThrottledSync();
    };

    const unsubscribe = storageClient.addWorkflowsListener(handleStorageChange);

    return () => {
      // Clean up listener on unmount
      unsubscribe();
    };
  }, []); // Load workflows once on mount

  const handleCreateWorkflow = () => {
    navigate("/designer"); // Navigate to designer without workflow ID
  };

  const handleCreateFromExample = (example: WorkflowDefinition) => {
    const newWorkflow = {
      ...example,
      id: newWorkflowId(),
      lastUpdated: Date.now(),
      executionCount: 0,
      lastExecuted: undefined,
    };

    // Pass the example as state to the designer
    navigate("/designer", { state: { exampleWorkflow: newWorkflow } });
  };
  const handleCreateBlankWorkflow = () => {
    // Pass the example as state to the designer
    navigate("/designer", { state: { blank: true } });
  };

  const handleEditWorkflow = (workflow: WorkflowDefinition) => {
    navigate(`/designer/${workflow.id}`); // Navigate to designer with workflow ID
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      await storageClient.deleteWorkflow(id);
      const updatedWorkflows = await storageClient.getWorkflows();
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error("Failed to delete workflow:", error);
    }
  };

  const handleToggleWorkflow = async (id: string) => {
    try {
      const updatedWorkflows = workflows.map((w) =>
        w.id === id
          ? {
              ...w,
              enabled: !w.enabled,
              lastUpdated: Date.now(),
            }
          : w,
      );
      await storageClient.saveWorkflows(updatedWorkflows);
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error("Failed to toggle workflow:", error);
    }
  };

  const handleExportWorkflow = (workflow: WorkflowDefinition) => {
    setWorkflowToExport(workflow);
    setExportModalOpened(true);
  };

  const handleDuplicateWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      const newWorkflow = {
        ...workflow,
        id: newWorkflowId(),
        name: `${workflow.name} (Copy)`,
        lastUpdated: Date.now(),
        executionCount: 0,
        lastExecuted: undefined,
      } as WorkflowDefinition;
      const updatedWorkflows = [...workflows, newWorkflow];
      await storageClient.saveWorkflows(updatedWorkflows);
      setWorkflows(updatedWorkflows);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to duplicate workflow:", error);
      alert("Failed to duplicate workflow. Please try again.");
    }
  };

  const handleImportWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      const updatedWorkflows = [...workflows, workflow];
      await storageClient.saveWorkflows(updatedWorkflows);
      setWorkflows(updatedWorkflows);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to import workflow:", error);
      alert("Failed to import workflow. Please try again.");
    }
  };

  return (
    <>
      <Card withBorder padding="lg" pos="relative">
        <LoadingOverlay visible={isSyncing} loaderProps={{ type: "dots" }} />
        <Group justify="space-between" mb="md">
          <Title order={3}>Workflows</Title>
          <Group>
            <Button
              variant="outline"
              leftSection={<IconUpload size={16} />}
              onClick={() => setImportModalOpened(true)}
              id="open-import-workflow-modal"
            >
              Import Workflow
            </Button>
            <Group gap="xs">
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleCreateWorkflow}
              >
                Create Workflow
              </Button>
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button
                    variant="light"
                    style={{ paddingLeft: 8, paddingRight: 8 }}
                    aria-label="Create workflow from example"
                  >
                    <IconChevronDown size={16} />
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item onClick={handleCreateBlankWorkflow}>
                    Create Blank Workflow
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Label>Start from Example</Menu.Label>
                  {exampleService.getExamples().map((example) => (
                    <Menu.Item
                      key={example.id}
                      onClick={() => handleCreateFromExample(example)}
                    >
                      {example.name}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Group>

        {workflows.length === 0 ? (
          <Stack align="center" py="xl">
            <IconNetwork size={64} color="gray" />
            <Text c="dimmed" ta="center">
              No workflows created yet. Visual workflows provide an intuitive
              way to create complex automations.
            </Text>
            <Button onClick={handleCreateWorkflow} mt="md">
              Create Your First Workflow
            </Button>
          </Stack>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>URL Pattern</Table.Th>
                <Table.Th>Description</Table.Th>
                <Table.Th ta="center">Nodes</Table.Th>
                <Table.Th ta="center">Enabled</Table.Th>
                <Table.Th ta="center">Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {workflows
                .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
                .map((workflow) => (
                  <ConfigWorkflowItem
                    key={workflow.id}
                    workflow={workflow}
                    handleEditWorkflow={handleEditWorkflow}
                    handleDeleteWorkflow={handleDeleteWorkflow}
                    handleToggleWorkflow={handleToggleWorkflow}
                    handleExportWorkflow={handleExportWorkflow}
                    handleDuplicateWorkflow={handleDuplicateWorkflow}
                  />
                ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
      <ImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
        onImport={handleImportWorkflow}
      />

      {workflowToExport && (
        <ExportModal
          opened={exportModalOpened}
          onClose={() => {
            setExportModalOpened(false);
            setWorkflowToExport(null);
          }}
          workflow={workflowToExport}
        />
      )}
    </>
  );
}
