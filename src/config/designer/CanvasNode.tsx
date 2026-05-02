import { useCallback, useState } from "react";
import {
  ActionNodeData,
  TriggerNodeData,
  WorkflowNode,
} from "@/types/workflow";
import { NotificationService } from "@/services/notification";
import { copyToClipboard } from "@/utils/helpers";
import { nodeCatalog } from "@/services/nodeCatalog";
import { ActionIcon, Card, Group, Stack, Text, Tooltip } from "@mantine/core";
import { Handle, Position } from "@xyflow/react";
import {
  IconAlertCircle,
  IconCopy,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useHover } from "@mantine/hooks";

interface CanvasNodeProps {
  data: WorkflowNode["data"] &
    WorkflowNode & {
      onDeleteNode?: (id: string) => void;
      onAddNodeFromHandle?: (nodeId: string, sourceHandle: string) => void;
      alwaysShowAddButton?: boolean;
      error: boolean;
      onCopyNode?: (id: string) => void;
    };
  id: string;
  selected: boolean;
}

function NodeHandle({
  type,
  position,
  id,
  percentage = 0.5,
  label,
  showButton = false,
  nodeId,
  onAddNodeFromHandle,
}: {
  type: "source" | "target";
  position: Position;
  id: string;
  percentage?: number;
  label?: string;
  showButton?: boolean;
  nodeId: string;
  onAddNodeFromHandle?: (nodeId: string, sourceHandle: string) => void;
}) {
  const isOutputHandle = type === "source" && position === Position.Right;
  const isRight = position === Position.Right;
  const [handleHovered, setHandleHovered] = useState(false);
  const showHandleButton =
    isOutputHandle && onAddNodeFromHandle ? showButton || handleHovered : false;

  return (
    <Handle
      key={id}
      type={type}
      position={position}
      id={id}
      style={{
        position: "absolute",
        top: `${percentage * 100}%`,
        right: isRight ? 0 : "auto",
        left: isRight ? "auto" : 0,
        transform: `translate(${isRight ? "50%" : "-50%"}, -50%)`,
        width: 16,
        height: 16,
        background: "#adb5bd",
        border: "2px solid #fff",
        borderRadius: "50%",
        transition: "all 0.2s ease",
        overflow: "visible",
        zIndex: 3,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#495057";
        if (isOutputHandle) {
          setHandleHovered(true);
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#adb5bd";
        if (isOutputHandle) {
          setHandleHovered(false);
        }
      }}
    >
      {(label || showHandleButton) && (
        <Group
          gap="xs"
          wrap="nowrap"
          style={{
            position: "absolute",
            top: "50%",
            left: isRight ? "100%" : "auto",
            right: isRight ? "auto" : "100%",
            transform: "translateY(-50%)",
            paddingLeft: isRight ? 8 : 0,
            paddingRight: isRight ? 0 : 8,
            pointerEvents: "all",
          }}
          onMouseEnter={() => {
            if (isOutputHandle) {
              setHandleHovered(true);
            }
          }}
          onMouseLeave={() => {
            if (isOutputHandle) {
              setHandleHovered(false);
            }
          }}
        >
          {!isRight && label ? (
            <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
              {label}
            </Text>
          ) : null}

          {isRight && label ? (
            <Text size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
              {label}
            </Text>
          ) : null}

          {showHandleButton ? (
            <ActionIcon
              size="sm"
              radius="xl"
              variant="light"
              aria-label={`Add node from ${id}`}
              onClick={(event) => {
                event.stopPropagation();
                onAddNodeFromHandle?.(nodeId, id);
              }}
            >
              <IconPlus size={12} />
            </ActionIcon>
          ) : null}
        </Group>
      )}
    </Handle>
  );
}

export default function CanvasNode({
  data: nodeData,
  id,
  selected,
}: CanvasNodeProps) {
  const { hovered, ref } = useHover();
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
    if (node.type === "action") {
      const nodeType = (node.data as ActionNodeData).type;
      return nodeCatalog.actions[nodeType]?.metadata.icon || "❓";
    } else if (node.type === "trigger") {
      const nodeType = (node.data as TriggerNodeData).type;
      return nodeCatalog.triggers[nodeType]?.metadata.icon || "❓";
    }

    return "❓";
  };

  const renderNodeIcon = (icon: string | React.ComponentType<any>) => {
    if (typeof icon === "string") {
      return <Text size="xl">{icon}</Text>;
    } else {
      const IconComponent = icon;
      return <IconComponent size={33} />;
    }
  };

  const getNodeLabel = (node: WorkflowNode) => {
    if (node.type === "action") {
      const nodeType = (node.data as ActionNodeData).type;
      return nodeCatalog.actions[nodeType]?.metadata.label || "Unknown";
    } else if (node.type === "trigger") {
      const nodeType = (node.data as TriggerNodeData).type;
      return nodeCatalog.triggers[nodeType]?.metadata.label || "Unknown";
    }

    return "Unknown";
  };

  const getNodeColor = (node: WorkflowNode) => {
    switch (node.type) {
      case "trigger":
        return "#e03131";
      case "action":
        return "#1971c2";

      default:
        return "#495057";
    }
  };

  const copyNode = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (nodeData.onCopyNode) {
      nodeData.onCopyNode(id);
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
      ref={ref}
      style={{
        width: "200px",
        borderColor,
        overflow: "visible", // Allow handles to show outside the card
      }}
      withBorder
    >
      {/* Input handles */}
      {(nodeData.inputs || []).map((input: string, index: number) => (
        <NodeHandle
          key={input}
          type="target"
          position={Position.Left}
          id={input}
          nodeId={id}
          percentage={(index + 1) / (nodeData.inputs!.length + 1)}
          label={(nodeData.inputs?.length ?? 0) > 1 ? input : undefined}
        />
      ))}

      {/* Output handles */}
      {(nodeData.outputs || []).map((output: string, index: number) => (
        <NodeHandle
          key={output}
          type="source"
          position={Position.Right}
          id={output}
          nodeId={id}
          percentage={(index + 1) / (nodeData.outputs!.length + 1)}
          label={(nodeData.outputs?.length ?? 0) > 1 ? output : undefined}
          showButton={hovered || Boolean(nodeData.alwaysShowAddButton)}
          onAddNodeFromHandle={nodeData.onAddNodeFromHandle}
        />
      ))}

      <Stack>
        <Stack gap="xs">
          <Group justify="space-between" mih={28}>
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
        <Group justify="end" gap="xs">
          <Tooltip label="Duplicate node" withArrow>
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={copyNode}
              aria-label="Duplicate node"
              style={{
                opacity: hovered || selected ? 1 : 0,
                transition: "opacity 0.2s",
              }}
            >
              <IconCopy size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete node" withArrow>
            <ActionIcon
              size="sm"
              color="red"
              variant="subtle"
              onClick={deleteNode}
              aria-label="Delete node"
              style={{
                opacity: hovered || selected ? 1 : 0,
                transition: "opacity 0.2s",
              }}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Stack>
    </Card>
  );
}
