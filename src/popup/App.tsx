import {
  Container,
  Text,
  Button,
  Stack,
  Divider,
  Tabs,
  Group,
  Box,
} from "@mantine/core";
import {
  IconPointer,
  IconHistory,
  IconWand,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import ActiveWorkflows from "./ActiveWorkflows";
import ExecutionHistory from "./ExecutionHistory";
import Logo from "@/components/Logo";
import { sendMessageToContentScript } from "@/lib/messages";
import browser from "@/services/browser";
import AiWorkflowChat from "./AiWorkflowChat";

type Size = {
  width: number;
  height: number;
};
const sizes: Record<string, Size> = {
  ai: { width: 600, height: 600 },
};
const DEFAULT_SIZE: Size = { width: 320, height: 500 };

function App() {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("workflows");

  // Load current URL and saved tab on startup
  useEffect(() => {
    loadCurrentUrl();
    loadSavedTab();
  }, []);

  const loadSavedTab = async () => {
    try {
      const result = await browser.storage.local.get(["popup-active-tab"]);
      if (result["popup-active-tab"]) {
        setActiveTab(result["popup-active-tab"]);
      }
    } catch (error) {
      console.error("Error loading saved tab:", error);
    }
  };

  // Save active tab to browser storage when it changes
  const handleTabChange = (value: string | null) => {
    if (value) {
      setActiveTab(value);
      try {
        browser.storage.local.set({ "popup-active-tab": value });
      } catch (error) {
        console.error("Error saving to browser storage:", error);
      }
    }
  };

  const loadCurrentUrl = async () => {
    try {
      // Get current tab URL
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tabs.length > 0) {
        setCurrentUrl(tabs[0].url || "");
      }
    } catch (error) {
      console.error("Error loading current URL:", error);
    }
  };

  const handleClick = () => {
    // open a new tab with a specific URL
    browser.tabs.create({ url: "https://houdin.config" });
    window.close();
  };

  const handleSelectElement = async () => {
    try {
      // send message to content script
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs.length > 0 && tabs[0].id) {
        sendMessageToContentScript(tabs[0].id, "START_ELEMENT_SELECTION", {});
      }
      window.close();
    } catch (error) {
      console.error("Error in handleSelectElement:", error);
    }
  };

  return (
    <>
      <Container
        size="xs"
        p="md"
        style={{
          width: sizes[activeTab]?.width || DEFAULT_SIZE.width,
          height: sizes[activeTab]?.height || DEFAULT_SIZE.height,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack gap="sm" h="100%">
          <Stack gap={0}>
            <Logo title size={32} />
            <Text size="sm" c="dimmed">
              Browser automation that feels like magic
            </Text>
          </Stack>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="pills"
            h="100%"
            display="flex"
            style={{ flexDirection: "column" }}
          >
            <Tabs.List grow>
              <Tabs.Tab value="ai">
                <Group wrap="nowrap" gap="xs" justify="center">
                  <IconWand size={16} />
                  {activeTab === "ai" && <Text size="sm">AI Builder</Text>}
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="workflows">
                <Group wrap="nowrap" gap="xs" justify="center">
                  <IconPlayerPlay size={16} />
                  {activeTab === "workflows" && (
                    <Text size="sm">Workflows</Text>
                  )}
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="history">
                <Group wrap="nowrap" gap="xs" justify="center">
                  <IconHistory size={16} />
                  {activeTab === "history" && <Text size="sm">History</Text>}
                </Group>
              </Tabs.Tab>
            </Tabs.List>

            <Box flex={1}>
              <Tabs.Panel value="ai" pt="sm" h="100%">
                {activeTab === "ai" && <AiWorkflowChat />}
              </Tabs.Panel>

              <Tabs.Panel value="workflows" pt="sm" h="100%">
                {activeTab === "workflows" && (
                  <Stack gap="md">
                    {/* Active Workflows Section */}
                    <ActiveWorkflows currentUrl={currentUrl} />

                    <Divider />

                    <Stack gap="xs">
                      <Button variant="filled" onClick={handleClick} fullWidth>
                        Open Configuration
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleSelectElement}
                        fullWidth
                        leftSection={<IconPointer size={16} />}
                      >
                        Element Inspector
                      </Button>
                    </Stack>

                    {/* Current URL info */}
                    <Text size="xs" c="dimmed" ta="center" truncate>
                      {currentUrl
                        ? new URL(currentUrl).hostname
                        : "No active tab"}
                    </Text>
                  </Stack>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="history" pt="md" h="100%">
                {activeTab === "history" && <ExecutionHistory />}
              </Tabs.Panel>
            </Box>
          </Tabs>
        </Stack>
      </Container>
    </>
  );
}

export default App;
