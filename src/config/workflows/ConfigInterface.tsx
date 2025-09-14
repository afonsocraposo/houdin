import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Card,
  Group,
  Badge,
  Notification,
  Alert,
  Table,
  Tabs,
  Anchor,
  Space,
} from "@mantine/core";
import logoSvg from "@/assets/icons/icon.svg";
import { initializeCredentials } from "@/services/credentialInitializer";
import {
  IconInfoCircle,
  IconCheck,
  IconPlus,
  IconNetwork,
  IconUpload,
  IconKey,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ContentStorageClient } from "@/services/storage";
import { ImportModal } from "./ImportModal";
import { ExportModal } from "./ExportModal";
import { CredentialsTab } from "@/config/credentials/CredentialsTab";
import { WorkflowDefinition } from "@/types/workflow";
import { APP_VERSION } from "@/utils/version";
import ConfigWorkflowItem from "./ConfigWorkflowItem";
import { generateId } from "@/utils/helpers";

function ConfigInterface() {
  // Initialize credentials on app startup
  useEffect(() => {
    initializeCredentials();
  }, []);

  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [saved, setSaved] = useState(false);
  const [showUrlAlert, setShowUrlAlert] = useState(false);
  const [importModalOpened, setImportModalOpened] = useState(false);
  const [exportModalOpened, setExportModalOpened] = useState(false);
  const [workflowToExport, setWorkflowToExport] =
    useState<WorkflowDefinition | null>(null);
  const [activeTab, setActiveTab] = useState<string>("workflows");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const storageClient = new ContentStorageClient();

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
    };

    const unsubscribe = storageClient.addWorkflowsListener(handleStorageChange);

    // Check if URL alert should be shown
    const urlAlertDismissed = localStorage.getItem("urlAlertDismissed");
    if (!urlAlertDismissed) {
      setShowUrlAlert(true);
    }

    return () => {
      // Clean up listener on unmount
      unsubscribe();
    };
  }, []); // Load workflows once on mount

  // Handle tab routing
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && (tabParam === "workflows" || tabParam === "credentials")) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab("workflows");
    }
  }, [searchParams]);

  const handleTabChange = (value: string | null) => {
    if (value && (value === "workflows" || value === "credentials")) {
      setActiveTab(value);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("tab", value);
      setSearchParams(newSearchParams, { replace: true });
    }
  };

  const handleCreateWorkflow = () => {
    navigate("/designer"); // Navigate to designer without workflow ID
  };

  const handleEditWorkflow = (workflow: WorkflowDefinition) => {
    navigate(`/designer/${workflow.id}`); // Navigate to designer with workflow ID
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const updatedWorkflows = workflows.filter((w) => w.id !== id);
      await storageClient.saveWorkflows(updatedWorkflows);
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error("Failed to delete workflow:", error);
    }
  };

  const handleToggleWorkflow = async (id: string) => {
    try {
      const updatedWorkflows = workflows.map((w) =>
        w.id === id ? { ...w, enabled: !w.enabled } : w,
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
        id: generateId(),
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
  const handleAlertClose = () => {
    localStorage.setItem("urlAlertDismissed", "true");
    setShowUrlAlert(false);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div style={{ textAlign: "center" }}>
          <img
            src={logoSvg}
            alt="changeme logo"
            style={{ width: 64, height: 64, marginBottom: 8 }}
          />
          <Title order={1} mt="sm">
            changeme
          </Title>
          <Text size="sm" c="dimmed">
            Create visual workflows to inject components and automate tasks on
            any website
          </Text>
        </div>

        {saved && (
          <Notification
            icon={<IconCheck size={18} />}
            color="green"
            title="Saved!"
            onClose={() => setSaved(false)}
          >
            Your changes have been saved successfully.
          </Notification>
        )}

        {showUrlAlert && (
          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Access this page anytime"
            color="blue"
            withCloseButton={true}
            onClose={handleAlertClose}
          >
            You can always access this configuration page by typing{" "}
            <Badge variant="light">https://changeme.config</Badge> in your
            browser address bar.
          </Alert>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} mt="md">
          <Tabs.List>
            <Tabs.Tab value="workflows" leftSection={<IconNetwork size={16} />}>
              Workflows
            </Tabs.Tab>
            <Tabs.Tab value="credentials" leftSection={<IconKey size={16} />}>
              Credentials
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="workflows" pt="md">
            <Card withBorder padding="lg">
              <Group justify="space-between" mb="md">
                <Title order={3}>Workflows</Title>
                <Group>
                  <Button
                    variant="outline"
                    leftSection={<IconUpload size={16} />}
                    onClick={() => setImportModalOpened(true)}
                  >
                    Import Workflow
                  </Button>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreateWorkflow}
                  >
                    Create Workflow
                  </Button>
                </Group>
              </Group>

              {workflows.length === 0 ? (
                <Stack align="center" py="xl">
                  <IconNetwork size={64} color="gray" />
                  <Text c="dimmed" ta="center">
                    No workflows created yet. Visual workflows provide an
                    intuitive way to create complex automations.
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
                      <Table.Th>Nodes</Table.Th>
                      <Table.Th>Enabled</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {workflows
                      .sort(
                        (a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0),
                      )
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
          </Tabs.Panel>

          <Tabs.Panel value="credentials" pt="md">
            <CredentialsTab onSaved={() => setSaved(true)} />
          </Tabs.Panel>
        </Tabs>

        <Space h="xl" />
        <Text size="xs" c="dimmed" ta="center">
          changeme Extension v{APP_VERSION} - Browser automation made simple
        </Text>
        <Text size="xs" c="dimmed" ta="center">
          Made with ❤️ by&nbsp;
          <Anchor target="_blank" href="https://afonsoraposo.com">
            Afonso Raposo
          </Anchor>
        </Text>
      </Stack>

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
    </Container>
  );
}

export default ConfigInterface;
