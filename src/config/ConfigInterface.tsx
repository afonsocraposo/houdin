import {
  Container,
  Text,
  Stack,
  Group,
  Badge,
  Notification,
  Alert,
  Tabs,
  Space,
  Box,
} from "@mantine/core";
import { initializeCredentials } from "@/services/credentialInitializer";
import {
  IconInfoCircle,
  IconCheck,
  IconNetwork,
  IconKey,
  IconClock,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { CredentialsTab } from "@/config/credentials/CredentialsTab";
import { APP_VERSION } from "@/utils/version";
import Logo from "@/components/Logo";
import WorkflowsTab from "./workflows/WorkflowsTab";
import ExecutionHistoryPage from "./history/ExecutionHistoryPage";
import Footer from "@/components/Footer";
import LoginButton from "@/components/LoginButton";
import { useStore } from "./store";
import SyncButton from "@/components/SyncButton";

enum TabOption {
  Workflows = "workflows",
  Credentials = "credentials",
  History = "history",
}

function ConfigInterface() {
  const fetchAccount = useStore((state) => state.fetchAccount);
  // Initialize credentials on app startup
  useEffect(() => {
    initializeCredentials();
    fetchAccount();
  }, [fetchAccount]);

  const [saved, setSaved] = useState(false);
  const [showUrlAlert, setShowUrlAlert] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("workflows");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // Check if URL alert should be shown
    const urlAlertDismissed = localStorage.getItem("urlAlertDismissed");
    if (!urlAlertDismissed) {
      setShowUrlAlert(true);
    }
  }, []); // Load workflows once on mount

  // Handle tab routing
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && Object.values(TabOption).includes(tabParam as TabOption)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab("workflows");
    }
  }, [searchParams]);

  const handleTabChange = (value: string | null) => {
    // check if value is one of the TabOption values
    if (value && Object.values(TabOption).includes(value as TabOption)) {
      setActiveTab(value);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("tab", value);
      setSearchParams(newSearchParams, { replace: true });
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
          <Group justify="center">
            <Logo size={48} title />
          </Group>
          <Text size="sm" c="dimmed">
            Browser automation that feels like magic
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
            <Badge variant="light">https://houdin.config</Badge> in your browser
            address bar.
          </Alert>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} mt="md">
          <Group>
            <Tabs.List flex={1}>
              <Tabs.Tab
                value={TabOption.Workflows}
                leftSection={<IconNetwork size={16} />}
              >
                Workflows
              </Tabs.Tab>
              <Tabs.Tab
                value={TabOption.Credentials}
                leftSection={<IconKey size={16} />}
              >
                Credentials
              </Tabs.Tab>
              <Tabs.Tab
                value={TabOption.History}
                leftSection={<IconClock size={16} />}
              >
                History
              </Tabs.Tab>
            </Tabs.List>
            <SyncButton />
            <LoginButton />
          </Group>

          <Box pt="md">
            <Tabs.Panel value={TabOption.Workflows}>
              <WorkflowsTab setSaved={setSaved} />
            </Tabs.Panel>

            <Tabs.Panel value={TabOption.Credentials}>
              <CredentialsTab onSaved={() => setSaved(true)} />
            </Tabs.Panel>

            <Tabs.Panel value={TabOption.History}>
              <ExecutionHistoryPage />
            </Tabs.Panel>
          </Box>
        </Tabs>

        <Space h="xl" />
        <Text size="xs" c="dimmed" ta="center">
          Houdin extension v{APP_VERSION}
        </Text>
        <Footer />
      </Stack>
    </Container>
  );
}

export default ConfigInterface;
