import { useCallback } from "react";
import {
  ActionNodeData,
  TriggerNodeData,
  WorkflowNode,
} from "@/types/workflow";
import { NotificationService } from "@/services/notification";
import { copyToClipboard } from "@/utils/helpers";
import { ActionRegistry } from "@/services/actionRegistry";
import { TriggerRegistry } from "@/services/triggerRegistry";
import { ActionIcon, Card, Group, Stack, Text, Tooltip } from "@mantine/core";
import { Handle, Position } from "@xyflow/react";
import { IconAlertCircle, IconTrash } from "@tabler/icons-react";

interface CanvasNodeProps {
  data: WorkflowNode["data"] &
    WorkflowNode & { onDeleteNode?: (id: string) => void; error: boolean };
  id: string;
  selected: boolean;
}

function NodeHandle({
  type,
  position,
  id,
}: {
  type: "source" | "target";
  position: Position;
  id: string;
}) {
  return (
    <Handle
      key={id}
      type={type}
      position={position}
      id={id}
      style={{
        top: "50%",
        width: 16,
        height: 16,
        background: "#adb5bd",
        border: "2px solid #fff",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#495057";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#adb5bd";
      }}
    />
  );
}

export default function CanvasNode({
  data: nodeData,
  id,
  selected,
}: CanvasNodeProps) {
  const handleCopyNodeId = useCallback(
    async (nodeId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      const success = await copyToClipboard(nodeId);
      if (success) {
        NotificationService.showNotification({
          message: `Node ID copied: ${nodeId}`,
          timeout: 1000,
        });
      } else {
        NotificationService.showErrorNotification({
          message: `Failed to copy node ID: ${nodeId}`,
          timeout: 1000,
        });
      }
    },
    [],
  );

  const getNodeIcon = (node: WorkflowNode) => {
    const actionRegistry = ActionRegistry.getInstance();
    const triggerRegistry = TriggerRegistry.getInstance();

    if (node.type === "action") {
      const nodeType = (node.data as ActionNodeData).type;
      const action = actionRegistry.getAction(nodeType);
      return action?.metadata.icon || "❓";
    } else if (node.type === "trigger") {
      const nodeType = (node.data as TriggerNodeData).type;
      const trigger = triggerRegistry.getTrigger(nodeType);
      return trigger?.metadata.icon || "❓";
    }

    return "❓";
  };

  const renderNodeIcon = (icon: string | React.ComponentType<any>) => {
    if (typeof icon === "string") {
      return <Text size="lg">{icon}</Text>;
    } else {
      const IconComponent = icon;
      return <IconComponent size={22} />;
    }
  };

  const getNodeLabel = (node: WorkflowNode) => {
    const actionRegistry = ActionRegistry.getInstance();
    const triggerRegistry = TriggerRegistry.getInstance();

    if (node.type === "action") {
      const nodeType = (node.data as ActionNodeData).type;
      const action = actionRegistry.getAction(nodeType);
      return action?.metadata.label || "Unknown";
    } else if (node.type === "trigger") {
      const nodeType = (node.data as TriggerNodeData).type;
      const trigger = triggerRegistry.getTrigger(nodeType);
      return trigger?.metadata.label || "Unknown";
    }

    return "Unknown";
  };

  const getNodeColor = (node: WorkflowNode) => {
    switch (node.type) {
      case "trigger":
        return "#e03131";
      case "action":
        return "#1971c2";
      case "condition":
        return "#f08c00";
      default:
        return "#495057";
    }
  };

  const deleteNode = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (nodeData.onDeleteNode) {
      nodeData.onDeleteNode(id);
    }
  };

  const borderColor = nodeData.error
    ? "red"
    : selected
      ? getNodeColor(nodeData)
      : "#dee2e6";
  return (
    <Card
      key={id}
      style={{
        width: "200px",
        borderColor,
        overflow: "visible", // Allow handles to show outside the card
      }}
      withBorder
    >
      {/* Input handles */}
      {(nodeData.inputs || []).map((input: string) =>
        NodeHandle({ type: "target", position: Position.Left, id: input }),
      )}

      {/* Output handles */}
      {(nodeData.outputs || []).map((output: string) =>
        NodeHandle({ type: "source", position: Position.Right, id: output }),
      )}

      <Stack>
        <Stack gap="xs">
          <Group justify="space-between">
            {renderNodeIcon(getNodeIcon(nodeData))}
            {nodeData.error && <IconAlertCircle color="red" />}
          </Group>
          <div>
            <Text size="sm" fw={500} c={getNodeColor(nodeData)}>
              {getNodeLabel(nodeData)}
            </Text>
            <Tooltip label="Click to copy Node ID" withArrow openDelay={250}>
              <Text
                size="xs"
                c="dimmed"
                style={{
                  fontFamily: "monospace",
                  cursor: "pointer",
                  userSelect: "all",
                }}
                onClick={(e) => handleCopyNodeId(id, e)}
              >
                {id}
              </Text>
            </Tooltip>
          </div>
        </Stack>
        <Group justify="end">
          <ActionIcon
            size="sm"
            color="red"
            variant="subtle"
            onClick={deleteNode}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Group>
      </Stack>
    </Card>
  );
}
