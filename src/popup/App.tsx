import { Container, Title, Text, Button, Stack } from "@mantine/core";
import { IconBrandChrome, IconPointer } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { ElementInfoModal } from "../components/ElementInfoModal";

function App() {
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const [_, setShowModal] = useState(true);

    // Cross-browser API compatibility
    const browserAPI = (typeof browser !== "undefined" ? browser : chrome) as any;

    useEffect(() => {
        // Load last selected element from storage
        browserAPI.storage.local.get(["lastSelectedElement"], (result: any) => {
            if (result.lastSelectedElement) {
                setSelectedElement(result.lastSelectedElement);
            }
        });

        // Listen for element selection messages
        const messageListener = (message: any) => {
            if (message.type === "ELEMENT_SELECTED") {
                const elementInfo = {
                    selector: message.selector,
                    element: message.element,
                    timestamp: Date.now(),
                };
                setSelectedElement(elementInfo);
                setShowModal(true);
            }
        };

        browserAPI.runtime.onMessage.addListener(messageListener);

        return () => {
            if (browserAPI.runtime.onMessage.removeListener) {
                browserAPI.runtime.onMessage.removeListener(messageListener);
            }
        };
    }, []);

    const handleClick = () => {
        // open a new tab with a specific URL
        browserAPI.tabs.create({ url: "https://changeme.config" });
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
                        Select Element
                    </Button>
                </Stack>
            </Container>
        </>
    );
}

export default App;
