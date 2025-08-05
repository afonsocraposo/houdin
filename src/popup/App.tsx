import { Container, Title, Text, Button, Stack } from "@mantine/core";
import { IconBrandChrome, IconPointer } from "@tabler/icons-react";

function App() {
  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;

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
      <Container size="xs" p="md" style={{ width: "300px", height: "400px" }}>
        <Stack gap="md">
          <div style={{ textAlign: "center" }}>
            <IconBrandChrome size={48} />
            <Title order={2} mt="sm">
              changeme
            </Title>
            <Text size="sm" c="dimmed">
              Browser automation made easy
            </Text>
          </div>

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
      </Container>
    </>
  );
}

export default App;
