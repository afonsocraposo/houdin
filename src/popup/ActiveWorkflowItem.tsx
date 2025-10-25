import { TriggerNodeData, WorkflowDefinition } from "@/types/workflow";
import { ActionIcon, Card, Group, Stack, Text } from "@mantine/core";
import browser from "@/services/browser";
import { sendMessageToContentScript } from "@/lib/messages";
import { MessageType } from "@/types/messages";
import { PopupTriggerMessage } from "@/types/background-workflow";
import { IconPlayerPlay } from "@tabler/icons-react";
import { useMemo } from "react";

export default function ActiveWorkflowItem({
  workflow,
}: {
  workflow: WorkflowDefinition;
}) {
  const popupTrigger = useMemo(
    () =>
      workflow.nodes.find(
        (n) =>
          n.type === "trigger" && (n.data as TriggerNodeData).type === "popup",
      ),
    [workflow],
  );
  const triggerWorkflow = async (workflow: WorkflowDefinition) => {
    if (!popupTrigger) {
      return;
    }

    const activeTab = (
      await browser.tabs.query({ active: true, currentWindow: true })
    )[0];

    if (!activeTab || !activeTab.id) {
      return;
    }

    console.debug("Triggering workflow popup:", workflow.id);
    // send message to content script
    sendMessageToContentScript<PopupTriggerMessage>(
      activeTab.id,
      MessageType.POPUP_TRIGGER,
      { workflowId: workflow.id },
    );

    // close popup
    window.close();
  };

  const handleWorkflowClick = (workflow: WorkflowDefinition) => {
    // Open workflow designer in new tab
    const designerUrl = browser.runtime.getURL(
      `src/config/index.html#/designer/${workflow.id}`,
    );
    browser.tabs.create({ url: designerUrl });
    window.close();
  };
  return (
    <Card
      key={workflow.id}
      padding="xs"
      withBorder
      style={{ cursor: "pointer" }}
      onClick={() => handleWorkflowClick(workflow)}
      title="Edit workflow"
    >
      <Group justify="space-between" gap="xs">
        <Stack gap="4">
          <Text size="xs" fw={500} truncate>
            {workflow.name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {workflow.urlPattern}
          </Text>
        </Stack>
        {popupTrigger && (
          <ActionIcon
            variant="subtle"
            onClick={(e) => {
              e.stopPropagation();
              triggerWorkflow(workflow);
            }}
            size="sm"
            title="Trigger workflow"
          >
            <IconPlayerPlay />
          </ActionIcon>
        )}
      </Group>
    </Card>
  );
}
