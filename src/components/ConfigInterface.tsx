import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Card,
  Switch,
  Group,
  Badge,
  Notification,
  Alert,
  ActionIcon,
  Table,
  Tabs,
  Anchor,
  Space,
} from "@mantine/core";
import logoSvg from "../assets/icons/icon.svg";
import { initializeCredentials } from "../services/credentialInitializer";
import {
  IconInfoCircle,
  IconCheck,
  IconPlus,
  IconTrash,
  IconEdit,
  IconNetwork,
  IconDownload,
  IconUpload,
  IconKey,
  IconHistory,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StorageManager } from "../services/storage";
import { ImportModal } from "./ImportModal";
import { ExportModal } from "./ExportModal";
import { CredentialsTab } from "./CredentialsTab";
import { WorkflowDefinition } from "../types/workflow";
import { APP_VERSION } from "../utils/version";

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
  const storageManager = StorageManager.getInstance();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Load existing workflows from storage using StorageManager
    const loadData = async () => {
      try {
        const loadedWorkflows = await storageManager.getWorkflows();
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

    storageManager.onStorageChanged(handleStorageChange);

    // Check if URL alert should be shown
    const urlAlertDismissed = localStorage.getItem("urlAlertDismissed");
    if (!urlAlertDismissed) {
      setShowUrlAlert(true);
    }
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
      await storageManager.saveWorkflows(updatedWorkflows);
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
      await storageManager.saveWorkflows(updatedWorkflows);
      setWorkflows(updatedWorkflows);
    } catch (error) {
      console.error("Failed to toggle workflow:", error);
    }
  };

  const handleExportWorkflow = (workflow: WorkflowDefinition) => {
    setWorkflowToExport(workflow);
    setExportModalOpened(true);
  };

  const handleImportWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      const updatedWorkflows = [...workflows, workflow];
      await storageManager.saveWorkflows(updatedWorkflows);
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
                        <Table.Tr key={workflow.id}>
                          <Table.Td>
                            <Text fw={500}>{workflow.name}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size="sm"
                              c="dimmed"
                              style={{ fontFamily: "monospace" }}
                            >
                              {workflow.urlPattern || "No pattern set"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="dimmed">
                              {workflow.description || "No description"}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light">
                              {workflow.nodes.length} nodes
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Switch
                              checked={workflow.enabled}
                              onChange={() => handleToggleWorkflow(workflow.id)}
                              size="sm"
                            />
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <ActionIcon
                                variant="subtle"
                                onClick={() => handleEditWorkflow(workflow)}
                                title="Edit workflow"
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() =>
                                  navigate(`/executions?workflow=${workflow.id}`)
                                }
                                title="View execution history"
                              >
                                <IconHistory size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() => handleExportWorkflow(workflow)}
                                title="Export workflow"
                              >
                                <IconDownload size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                onClick={() =>
                                  handleDeleteWorkflow(workflow.id)
                                }
                                title="Delete workflow"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                           </Table.Td>
                         </Table.Tr>                      ))}
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
