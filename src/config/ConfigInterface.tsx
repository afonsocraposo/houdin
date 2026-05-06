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
  IconTrash,
  IconSettings,
} from "@tabler/icons-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { CredentialsTab } from "@/config/credentials/CredentialsTab";
import { APP_VERSION } from "@/utils/version";
import Logo from "@/components/Logo";
import WorkflowsTab from "./workflows/WorkflowsTab";
import ExecutionHistoryPage from "./history/ExecutionHistoryPage";
import Footer from "@/components/Footer";
import LoginButton from "@/components/LoginButton";
import { useSessionStore } from "@/store";
import TrashWorkflowsTab from "./trash/TrashWorkflowsTab";
import { useDisclosure } from "@mantine/hooks";
import UpgradeModal from "@/components/modals/upgradeModal";
import SettingsTab from "./settings/SettingsTab";
import { trackPageView } from "@/services/plausible";
import type { ConfigSearch } from "./router";

type SearchUpdater = (prev: ConfigSearch) => ConfigSearch;

enum TabOption {
  Workflows = "workflows",
  Trash = "trash",
  Credentials = "credentials",
  History = "history",
  Settings = "settings",
}

function ConfigInterface() {
  const navigate = useNavigate();
  const fetchAccount = useSessionStore((state) => state.fetchAccount);
  const account = useSessionStore((state) => state.account);
  const isFree = useMemo(() => !account || account.plan === "free", [account]);
  // Initialize credentials on app startup
  useEffect(() => {
    initializeCredentials();
    fetchAccount();
  }, [fetchAccount]);

  const [saved, setSaved] = useState(false);
  const [showUrlAlert, setShowUrlAlert] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const search = useSearch({ strict: false }) as ConfigSearch;
  const activeTab = search.tab ?? "workflows";

  useEffect(() => {
    trackPageView("/config");
    // Check if URL alert should be shown
    const urlAlertDismissed = localStorage.getItem("urlAlertDismissed");
    if (!urlAlertDismissed) {
      setShowUrlAlert(true);
    }
  }, []); // Load workflows once on mount

  const handleTabChange = (value: string | null) => {
    if (value && Object.values(TabOption).includes(value as TabOption)) {
      if (value === TabOption.Trash && isFree) {
        open();
        navigate({ to: "/", search: ((prev: ConfigSearch) => ({ ...prev, tab: "workflows" })) as SearchUpdater });
        return;
      }
      navigate({ to: "/", search: ((prev: ConfigSearch) => ({ ...prev, tab: value as TabOption })) as SearchUpdater });
    } else {
      navigate({ to: "/", search: ((prev: ConfigSearch) => ({ ...prev, tab: TabOption.Workflows })) as SearchUpdater });
    }
  };

  const handleAlertClose = () => {
    localStorage.setItem("urlAlertDismissed", "true");
    setShowUrlAlert(false);
  };

  return (
    <>
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
              <Badge variant="light">https://houdin.config</Badge> in your
              browser address bar.
            </Alert>
          )}

          <Tabs value={activeTab} onChange={handleTabChange} mt="md">
            <Group>
              <Tabs.List flex={1}>
                <Tabs.Tab value={TabOption.Workflows} leftSection={<IconNetwork size={16} />}>
                  Workflows
                </Tabs.Tab>
                <Tabs.Tab value={TabOption.Credentials} leftSection={<IconKey size={16} />}>
                  Credentials
                </Tabs.Tab>
                <Tabs.Tab value={TabOption.History} leftSection={<IconClock size={16} />}>
                  History
                </Tabs.Tab>
                <Tabs.Tab value={TabOption.Trash} leftSection={<IconTrash size={16} />}>
                  Trash
                </Tabs.Tab>
                <Tabs.Tab value={TabOption.Settings} leftSection={<IconSettings size={16} />}>
                  Settings
                </Tabs.Tab>
              </Tabs.List>
              <LoginButton />
            </Group>

            <Box pt="md">
              <Tabs.Panel value={TabOption.Workflows}>
                <WorkflowsTab setSaved={setSaved} />
              </Tabs.Panel>
              <Tabs.Panel value={TabOption.Trash}>
                <TrashWorkflowsTab />
              </Tabs.Panel>

              <Tabs.Panel value={TabOption.Credentials}>
                <CredentialsTab onSaved={() => setSaved(true)} />
              </Tabs.Panel>

              <Tabs.Panel value={TabOption.History}>
                <ExecutionHistoryPage />
              </Tabs.Panel>
              <Tabs.Panel value={TabOption.Settings}>
                <SettingsTab />
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
      <UpgradeModal opened={opened} onClose={close} />
    </>
  );
}

export default ConfigInterface;
