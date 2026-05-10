import browser from "@/services/browser";
import Chatbot from "@/components/ai/Chatbot";
import ChatSessionSelect from "@/components/ai/ChatSessionSelect";
import { ChatbotService } from "@/services/chatbot";
import { useStore } from "@/store";
import { newWorkflowId } from "@/utils/helpers";
import { ActionIcon, Badge, Group, Stack, Tooltip } from "@mantine/core";
import { IconEraser, IconExternalLink, IconPlus } from "@tabler/icons-react";
import { useEffect } from "react";

export default function ChatbotPanel() {
  const { popupSessionId, setPopupSessionId } = useStore();

  // Initialize a stable session id on first mount if none exists
  useEffect(() => {
    if (!popupSessionId) {
      setPopupSessionId(newWorkflowId());
    }
  }, [popupSessionId, setPopupSessionId]);

  const session = useStore((state) =>
    popupSessionId ? state.getSessionByWorkflowId(popupSessionId) : null,
  );
  const workflow = useStore((state) =>
    popupSessionId ? state.readWorkflow(popupSessionId) : null,
  );

  const handleNewSession = () => {
    setPopupSessionId(newWorkflowId());
  };
  const handleClearSession = () => {
    if (popupSessionId) ChatbotService.clearChat(popupSessionId);
  };
  const handleOpenInDesigner = () => {
    if (popupSessionId) {
      const designerUrl =
        browser.runtime.getURL("src/config/index.html") +
        `#/designer/${popupSessionId}`;
      browser.tabs.create({ url: designerUrl });
      window.close();
    }
  };

  return (
    <Stack h="100%">
      <Group justify="space-between" align="center">
        <Group gap="xs" wrap="nowrap">
          <ChatSessionSelect
            value={popupSessionId}
            onSelect={(value) => setPopupSessionId(value)}
          />
          <Tooltip label="New session">
            <ActionIcon
              variant="light"
              size="input-sm"
              aria-label="Create new session"
              onClick={handleNewSession}
            >
              <IconPlus size={16} />
            </ActionIcon>
          </Tooltip>
          {session && session.messages.length > 0 && (
            <Tooltip label="Clear current session">
              <ActionIcon
                variant="subtle"
                size="input-sm"
                aria-label="Clear current session"
                onClick={handleClearSession}
              >
                <IconEraser size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        {workflow && (
          <Group gap="xs" wrap="nowrap">
            <Badge color="blue" variant="light" size="sm">
              {workflow.nodes.length} Nodes
            </Badge>
            <Badge
              color="green"
              variant="light"
              size="sm"
              maw={200}
              title={workflow.urlPattern}
            >
              {workflow.urlPattern}
            </Badge>
            <Tooltip label="Open workflow in designer">
              <ActionIcon
                variant="subtle"
                size="input-sm"
                aria-label="Open workflow in designer"
                onClick={handleOpenInDesigner}
              >
                <IconExternalLink size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>
      <Chatbot workflowId={popupSessionId} />
    </Stack>
  );
}
