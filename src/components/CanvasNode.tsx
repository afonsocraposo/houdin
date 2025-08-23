import { useCallback } from "react";
import { WorkflowNode } from "../types/workflow";
import { NotificationService } from "../services/notification";
import { copyToClipboard } from "../utils/helpers";
import { ActionRegistry } from "../services/actionRegistry";
import { TriggerRegistry } from "../services/triggerRegistry";
import { ActionIcon, Card, Group, Text, Tooltip } from "@mantine/core";
import { Handle, Position } from "@xyflow/react";
import { IconTrash } from "@tabler/icons-react";

interface CanvasNodeProps {
  data: WorkflowNode["data"] & WorkflowNode;
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

    const nodeType = node.data[node.type + "Type"];

    if (node.type === "action") {
      const action = actionRegistry.getAction(nodeType);
      return action?.metadata.icon || "❓";
    } else if (node.type === "trigger") {
      const trigger = triggerRegistry.getTrigger(nodeType);
      return trigger?.metadata.icon || "❓";
    }

    return "❓";
  };

  const getNodeLabel = (node: WorkflowNode) => {
    const actionRegistry = ActionRegistry.getInstance();
    const triggerRegistry = TriggerRegistry.getInstance();

    const nodeType = node.data[node.type + "Type"];

    if (node.type === "action") {
      const action = actionRegistry.getAction(nodeType);
      return action?.metadata.label || "Unknown";
    } else if (node.type === "trigger") {
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

  return (
    <Card
      style={{
        width: "200px",
        border: selected
          ? `2px solid ${getNodeColor(nodeData)}`
          : "1px solid #dee2e6",
        background: "white",
        overflow: "visible", // Allow handles to show outside the card
      }}
    >
      {/* Input handles */}
      {(nodeData.inputs || []).map((input: string) =>
        NodeHandle({ type: "target", position: Position.Left, id: input }),
      )}

      {/* Output handles */}
      {(nodeData.outputs || []).map((output: string) =>
        NodeHandle({ type: "source", position: Position.Right, id: output }),
      )}

      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Text size="lg">{getNodeIcon(nodeData)}</Text>
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
        </Group>
        <ActionIcon size="sm" color="red" variant="subtle" onClick={deleteNode}>
          <IconTrash size={14} />
        </ActionIcon>
      </Group>

      <Text size="xs" c="dimmed">
        {nodeData.type}
      </Text>
    </Card>
  );
}
