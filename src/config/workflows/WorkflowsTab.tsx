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
} from "@mantine/core";
import {
  IconNetwork,
  IconPlus,
  IconUpload,
  IconChevronDown,
} from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ImportModal } from "./ImportModal";
import ConfigWorkflowItem from "./ConfigWorkflowItem";
import { ExportModal } from "./ExportModal";
import { newWorkflowId } from "@/utils/helpers";
import { useStore } from "@/store";
import SyncButton from "@/components/SyncButton";
import { NotificationService } from "@/services/notification";
import { PlausibleEvent, trackCustomEvent } from "@/services/plausible";

export default function WorkflowsTab({
  setSaved,
}: {
  setSaved: (saved: boolean) => void;
}) {
  const workflows = useStore((state) => state.workflows);
  const createWorkflow = useStore((state) => state.createWorkflow);
  const updateWorkflow = useStore((state) => state.updateWorkflow);
  const deleteWorkflow = useStore((state) => state.deleteWorkflow);
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [exportModalOpened, setExportModalOpened] = useState(false);
  const [workflowToExport, setWorkflowToExport] =
    useState<WorkflowDefinition | null>(null);

  const exampleService = useMemo(() => new ExampleService(), []);

  const navigate = useNavigate();

  const handleCreateWorkflow = () => {
    navigate({ to: "/designer", search: { init: "blank" } as never });
  };

  const handleCreateFromExample = (example: WorkflowDefinition) => {
    const newWorkflow = {
      ...example,
      id: newWorkflowId(),
      modifiedAt: Date.now(),
      executionCount: 0,
      lastExecuted: undefined,
    };

    sessionStorage.setItem(
      "workflow-draft-example",
      JSON.stringify(newWorkflow),
    );
    navigate({ to: "/designer", search: { init: "example" } as never });
  };

  const handleEditWorkflow = (workflow: WorkflowDefinition) => {
    navigate({
      to: "/designer/$workflowId",
      params: { workflowId: workflow.id },
      search: {},
    });
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      deleteWorkflow(id);
      void trackCustomEvent(PlausibleEvent.WorkflowDeleted, "/config");
    } catch {
      NotificationService.showErrorNotification({
        message: "Couldn't delete workflow. Please try again.",
      });
    }
  };

  const handleToggleWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      updateWorkflow({
        ...workflow,
        enabled: !workflow.enabled,
        modifiedAt: Date.now(),
      });
    } catch {
      NotificationService.showErrorNotification({
        message: "Couldn't update workflow. Please try again.",
      });
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
        modifiedAt: Date.now(),
        executionCount: 0,
        lastExecuted: undefined,
      } as WorkflowDefinition;
      createWorkflow(newWorkflow);
      void trackCustomEvent(PlausibleEvent.WorkflowCreated, "/config", {
        source: "duplicate",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      NotificationService.showErrorNotification({
        message: "Couldn't duplicate workflow. Please try again.",
      });
    }
  };

  const handleImportWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      const newWorkflow = {
        ...workflow,
        id: newWorkflowId(),
        modifiedAt: Date.now(),
        executionCount: 0,
        lastExecuted: undefined,
      } as WorkflowDefinition;
      createWorkflow(newWorkflow);
      void trackCustomEvent(PlausibleEvent.WorkflowCreated, "/config", {
        source: "import",
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      NotificationService.showErrorNotification({
        message: "Couldn't import workflow. Check the file and try again.",
      });
    }
  };

  return (
    <>
      <Card withBorder padding="lg">
        <Group justify="space-between" mb="md">
          <Group>
            <Title order={3}>Workflows</Title>
            <SyncButton />
          </Group>
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
            <IconNetwork size={64} />
            <Text c="dimmed" ta="center" maw={400}>
              No workflows yet. Create your first one to automate browser tasks
              visually.
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
                .sort((a, b) => (b.modifiedAt || 0) - (a.modifiedAt || 0))
                .map((workflow) => (
                  <ConfigWorkflowItem
                    key={workflow.id}
                    workflow={workflow}
                    handleEditWorkflow={handleEditWorkflow}
                    handleDeleteWorkflow={handleDeleteWorkflow}
                    handleToggleWorkflow={() => handleToggleWorkflow(workflow)}
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
