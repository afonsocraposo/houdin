import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Divider,
  Tabs,
} from "@mantine/core";
import { IconPointer, IconHistory, IconHome } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { initializeCredentials } from "../services/credentialInitializer";
import ActiveWorkflows from "./ActiveWorkflows";
import ExecutionHistory from "./ExecutionHistory";
import iconSvg from "../assets/icons/icon.svg";

function App() {
  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;
  const [currentUrl, setCurrentUrl] = useState<string>("");

  // Initialize credentials on app startup
  useEffect(() => {
    initializeCredentials();
    loadCurrentUrl();
  }, []);

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
    browserAPI.tabs.create({ url: "https://changeme.config" });
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
          <div style={{ textAlign: "center" }}>
            <img
              src={iconSvg}
              alt="changeme icon"
              style={{ width: 48, height: 48 }}
            />
            <Title order={2} mt="xs">
              changeme
            </Title>
            <Text size="sm" c="dimmed">
              Browser automation made simple
            </Text>
          </div>

          <Tabs defaultValue="workflows" variant="pills">
            <Tabs.List grow>
              <Tabs.Tab value="workflows" leftSection={<IconHome size={16} />}>
                Workflows
              </Tabs.Tab>
              <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
                History
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="workflows" pt="sm">
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
                  {currentUrl ? new URL(currentUrl).hostname : "No active tab"}
                </Text>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="history" pt="md">
              <ExecutionHistory />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>
    </>
  );
}

export default App;
