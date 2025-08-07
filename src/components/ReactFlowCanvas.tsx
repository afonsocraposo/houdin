import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  MiniMap,
  NodeProps,
  Handle,
  Position,
  ConnectionLineType,
  NodeChange,
  EdgeChange,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Box,
  Group,
  Text,
  ActionIcon,
  Card,
  Button,
  Stack,
  Transition,
  Paper,
  Tooltip,
} from "@mantine/core";
import { IconPlus, IconTrash, IconLayoutGrid } from "@tabler/icons-react";
import {
  WorkflowNode,
  WorkflowConnection,
  NODE_CATEGORIES,
} from "../types/workflow";
import { copyToClipboard } from "../utils/helpers";
import dagre from "@dagrejs/dagre";
import { NotificationService } from "../services/notification";

interface ReactFlowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onConnectionsChange: (connections: WorkflowConnection[]) => void;
  onNodeSelect: (node: WorkflowNode | null) => void;
  selectedNode: WorkflowNode | null;
}

// Custom node component
const CustomNode: React.FC<NodeProps> = ({ data, id, selected }) => {
  const nodeData = data as WorkflowNode["data"] & WorkflowNode;

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
    const allCategories = [
      ...NODE_CATEGORIES.triggers,
      ...NODE_CATEGORIES.actions,
      ...NODE_CATEGORIES.conditions,
    ];
    const nodeType = node.data[node.type + "Type"];
    const definition = allCategories.find((cat) => cat.type === nodeType);
    return definition?.icon || "❓";
  };

  const getNodeLabel = (node: WorkflowNode) => {
    const allCategories = [
      ...NODE_CATEGORIES.triggers,
      ...NODE_CATEGORIES.actions,
      ...NODE_CATEGORIES.conditions,
    ];
    const nodeType = node.data[node.type + "Type"];
    const definition = allCategories.find((cat) => cat.type === nodeType);
    return definition?.label || nodeType;
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
      {(nodeData.inputs || []).map((input: string) => (
        <Handle
          key={input}
          type="target"
          position={Position.Left}
          id={input}
          style={{
            top: "50%",
            transformOrigin: "center",
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
      ))}

      {/* Output handles */}
      {(nodeData.outputs || []).map((output: string) => (
        <Handle
          key={output}
          type="source"
          position={Position.Right}
          id={output}
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
      ))}

      <Group justify="space-between" mb="xs">
        <Group gap="xs">
          <Text size="lg">{getNodeIcon(nodeData)}</Text>
          <div>
            <Text size="sm" fw={500} c={getNodeColor(nodeData)}>
              {getNodeLabel(nodeData)}
            </Text>
            <Text
              size="xs"
              c="dimmed"
              style={{
                fontFamily: "monospace",
                cursor: "pointer",
                userSelect: "all",
              }}
              onClick={(e) => handleCopyNodeId(id, e)}
              title="Click to copy node ID"
            >
              {id}
            </Text>
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
};

export const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ReactFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};

const ReactFlowCanvasInner: React.FC<ReactFlowCanvasProps> = ({
  nodes: workflowNodes,
  connections: workflowConnections,
  onNodesChange,
  onConnectionsChange,
  onNodeSelect,
  selectedNode,
}) => {
  const [showNodePalette, setShowNodePalette] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Center and zoom to fit on initial load and when nodes change
  useEffect(() => {
    if (workflowNodes.length > 0) {
      // Set zoom to 100% (1.0) and center the nodes
      setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.1,
          minZoom: 1,
          maxZoom: 1,
        });
      }, 100); // Small delay to ensure nodes are rendered
    }
  }, [workflowNodes.length, reactFlowInstance]);

  // Handle node deletion directly
  const handleNodeDeletion = useCallback(
    (nodeId: string) => {
      // Always clear selection first, regardless of which node is being deleted
      onNodeSelect(null);

      // Then update nodes and connections
      const updatedNodes = workflowNodes.filter((n) => n.id !== nodeId);
      const updatedConnections = workflowConnections.filter(
        (c) => c.source !== nodeId && c.target !== nodeId,
      );
      onNodesChange(updatedNodes);
      onConnectionsChange(updatedConnections);
    },
    [
      workflowNodes,
      workflowConnections,
      onNodesChange,
      onConnectionsChange,
      onNodeSelect,
    ],
  );

  // Convert workflow nodes to React Flow nodes
  const reactFlowNodes: Node[] = useMemo(
    () =>
      workflowNodes.map((node) => ({
        id: node.id,
        type: "custom",
        position: node.position,
        data: { ...node.data, ...node, onDeleteNode: handleNodeDeletion }, // Include delete handler
        selected: selectedNode?.id === node.id,
      })),
    [workflowNodes, selectedNode, handleNodeDeletion],
  );

  // Convert workflow connections to React Flow edges
  const reactFlowEdges: Edge[] = useMemo(
    () =>
      workflowConnections.map((conn) => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
        type: "smoothstep",
        animated: false,
      })),
    [workflowConnections],
  );

  const [nodes, setNodes, onNodesChangeFlow] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChangeFlow] = useEdgesState(reactFlowEdges);

  // Update React Flow state when workflow data changes (but prevent infinite loops)
  React.useEffect(() => {
    setNodes(reactFlowNodes);
  }, [workflowNodes, setNodes, selectedNode]); // Update when nodes or selection changes

  React.useEffect(() => {
    setEdges(reactFlowEdges);
  }, [workflowConnections, setEdges]); // Update when connections change

  // Handle node position changes
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeFlow(changes);

      // Extract position changes and update workflow nodes
      const positionChanges = changes.filter(
        (
          change,
        ): change is NodeChange & {
          type: "position";
          position: { x: number; y: number };
          dragging: boolean;
        } =>
          change.type === "position" &&
          "position" in change &&
          "dragging" in change &&
          !change.dragging,
      );

      if (positionChanges.length > 0) {
        const updatedNodes = workflowNodes.map((node) => {
          const positionChange = positionChanges.find(
            (change) => change.id === node.id,
          );
          if (positionChange) {
            return { ...node, position: positionChange.position };
          }
          return node;
        });

        onNodesChange(updatedNodes);
      }
    },
    [onNodesChangeFlow, workflowNodes, onNodesChange],
  );

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const newConnection: WorkflowConnection = {
        id: `conn-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || "output",
        targetHandle: params.targetHandle || "input",
      };

      onConnectionsChange([...workflowConnections, newConnection]);
    },
    [workflowConnections, onConnectionsChange],
  );

  // Handle edge deletion
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeFlow(changes);

      // Handle edge removals
      changes.forEach((change) => {
        if (change.type === "remove") {
          const updatedConnections = workflowConnections.filter(
            (c) => c.id !== change.id,
          );
          onConnectionsChange(updatedConnections);
        }
      });
    },
    [onEdgesChangeFlow, workflowConnections, onConnectionsChange],
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setShowNodePalette(false);
      const workflowNode = workflowNodes.find((n) => n.id === node.id);
      onNodeSelect(workflowNode || null);
    },
    [workflowNodes, onNodeSelect],
  );

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    setShowNodePalette(false);
    onNodeSelect(null);
  }, [onNodeSelect]);

  const getLayoutedElements = useCallback(
    (nodes: WorkflowNode[], edges: WorkflowConnection[]) => {
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({
        rankdir: "LR", // Left to right layout
        nodesep: 100, // Horizontal spacing between nodes
        ranksep: 100, // Vertical spacing between ranks/levels
      });

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 200, height: 150 });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      // Apply dagre positions directly to all nodes
      const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 100, // Center the node (width/2)
            y: nodeWithPosition.y - 75, // Center the node (height/2)
          },
        };
      });

      return { nodes: newNodes, edges };
    },
    [],
  );

  const autoArrange = useCallback(() => {
    const { nodes: layoutedNodes } = getLayoutedElements(
      workflowNodes,
      workflowConnections,
    );
    onNodesChange(layoutedNodes);
  }, [workflowNodes, workflowConnections, onNodesChange, getLayoutedElements]);

  const createNode = (
    type: string,
    category: "triggers" | "actions" | "conditions",
  ) => {
    const nodeType = category.slice(0, -1) as
      | "trigger"
      | "action"
      | "condition";
    let defaultConfig = {};

    if (nodeType === "action" && type === "inject-component") {
      defaultConfig = {
        componentType: "button",
        componentText: "Button",
        targetSelector: "body",
      };
    }

    const newNode: WorkflowNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: 0, y: 0 }, // Temporary position, will be updated by layout
      data: { [nodeType + "Type"]: type, config: defaultConfig },
      inputs: category === "triggers" ? [] : ["input"],
      outputs: category === "conditions" ? ["true", "false"] : ["output"],
    };

    const updatedNodes = [...workflowNodes, newNode];

    // Auto-arrange after adding the new node
    const { nodes: layoutedNodes } = getLayoutedElements(
      updatedNodes,
      workflowConnections,
    );
    onNodesChange(layoutedNodes);
    setShowNodePalette(false);
  };

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    [],
  );

  return (
    <Box style={{ position: "relative", width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitView
        fitViewOptions={{
          padding: 0.1,
          minZoom: 1,
          maxZoom: 1,
        }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Auto-arrange Button */}
      <Tooltip label="Auto-arrange nodes">
        <ActionIcon
          style={{ position: "absolute", top: 16, left: 16, zIndex: 1000 }}
          onClick={autoArrange}
          variant="subtle"
        >
          <IconLayoutGrid />
        </ActionIcon>
      </Tooltip>

      {/* Add Node Button */}
      <ActionIcon
        style={{ position: "absolute", top: 16, right: 16 }}
        onClick={() => setShowNodePalette(!showNodePalette)}
      >
        <IconPlus size={32} />
      </ActionIcon>
      <Transition
        mounted={showNodePalette}
        transition="slide-left"
        duration={200}
        timingFunction="ease"
      >
        {(styles) => (
          <Paper
            shadow="md"
            p="md"
            style={{
              ...styles,
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: 300,
              zIndex: 1,
            }}
          >
            <Text fw={500} mb="md">
              Add Node
            </Text>
            {Object.entries(NODE_CATEGORIES).map(([category, items]) => (
              <div key={category}>
                <Text size="sm" fw={500} c="dimmed" tt="capitalize" mb="xs">
                  {category}
                </Text>
                {items.map((item) => (
                  <Button
                    key={item.type}
                    variant="subtle"
                    fullWidth
                    justify="start"
                    leftSection={<Text size="lg">{item.icon}</Text>}
                    mb="xs"
                    onClick={() => createNode(item.type, category as any)}
                  >
                    <Stack align="flex-start" gap={0}>
                      <Text size="sm">{item.label}</Text>
                      <Text size="xs" c="dimmed">
                        {item.description}
                      </Text>
                    </Stack>
                  </Button>
                ))}
              </div>
            ))}
          </Paper>
        )}
      </Transition>
    </Box>
  );
};
