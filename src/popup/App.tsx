import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Divider,
  Tabs,
  Group,
} from "@mantine/core";
import { IconPointer, IconHistory, IconHome } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import ActiveWorkflows from "./ActiveWorkflows";
import ExecutionHistory from "./ExecutionHistory";
import iconSvg from "@/assets/icons/icon.svg";

function App() {
  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("workflows");

  // Load current URL and saved tab on startup
  useEffect(() => {
    loadCurrentUrl();
    loadSavedTab();
  }, []);

  const loadSavedTab = async () => {
    try {
      const result = await new Promise<any>((resolve) => {
        browserAPI.storage.local.get(["popup-active-tab"], resolve);
      });
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
        browserAPI.storage.local.set({ "popup-active-tab": value });
      } catch (error) {
        console.error("Error saving to browser storage:", error);
      }
    }
  };

  const loadCurrentUrl = async () => {
    try {
      // Get current tab URL
      const tabs = await new Promise<any[]>((resolve) => {
        browserAPI.tabs.query({ active: true, currentWindow: true }, resolve);
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
    browserAPI.tabs.create({ url: "https://houdin.config" });
    window.close();
  };

  const handleSelectElement = async () => {
    try {
      // send message to content script
      browserAPI.tabs.query(
        { active: true, currentWindow: true },
        (tabs: any[]) => {
          if (tabs.length > 0 && tabs[0].id) {
            browserAPI.tabs.sendMessage(tabs[0].id, {
              type: "START_ELEMENT_SELECTION",
            });
          }
        },
      );
      window.close();
    } catch (error) {
      console.error("Error in handleSelectElement:", error);
    }
  };

  return (
    <>
      <Container size="xs" p="md" style={{ width: "320px", height: "500px" }}>
        <Stack gap="sm">
          <Group align="center">
            <img
              src={iconSvg}
              alt="Houdin icon"
              style={{ width: 48, height: 48 }}
            />
            <Stack gap={0}>
              <Title order={2}>Houdin</Title>
              <Text size="sm" c="dimmed">
                Browser automation that feels like magic 🪄
              </Text>
            </Stack>
          </Group>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="pills"
            flex={1}
          >
            <Tabs.List grow>
              <Tabs.Tab value="workflows" leftSection={<IconHome size={16} />}>
                Workflows
              </Tabs.Tab>
              <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                History
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="workflows" pt="sm">
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

            <Tabs.Panel value="history" pt="md">
              {activeTab === "history" && <ExecutionHistory />}
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>
    </>
  );
}

export default App;
