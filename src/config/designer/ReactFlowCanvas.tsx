import React, {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
} from "react";
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
  ConnectionLineType,
  NodeChange,
  EdgeChange,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Box,
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
} from "@mantine/core";
import { IconLayoutGrid } from "@tabler/icons-react";
import { WorkflowNode, WorkflowConnection, NodeType } from "@/types/workflow";
import dagre from "@dagrejs/dagre";
import { initializeTriggers } from "@/services/triggerInitializer";
import { initializeActions } from "@/services/actionInitializer";
import CanvasNode from "./CanvasNode";
import { useHotkeys } from "@mantine/hooks";
import { NotificationService } from "@/services/notification";
import AddNodeList from "./AddNodeList";

interface ReactFlowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onConnectionsChange: (connections: WorkflowConnection[]) => void;
  onNodeSelect: (node: WorkflowNode | null) => void;
  selectedNode: WorkflowNode | null;
  errors: Record<string, Record<string, string[]>>;
}

export const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = (props) => {
  useEffect(() => {
    // Initialize registries to ensure they're loaded
    initializeTriggers();
    initializeActions();
  }, []);
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
  errors,
}) => {
  const colorScheme = useComputedColorScheme();
  const reactFlowInstance = useReactFlow();
  const hasInitialized = useRef(false);
  const [showNodePalette, setShowNodePalette] = useState(false);

  useEffect(() => {
    if (selectedNode !== null) setShowNodePalette(false);
  }, [selectedNode]);

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
        data: {
          ...node.data,
          ...node,
          onDeleteNode: handleNodeDeletion,
          error: errors[node.id] !== undefined,
        },
        selected: selectedNode?.id === node.id,
      })),
    [workflowNodes, selectedNode, handleNodeDeletion, errors],
  );

  // Convert workflow connections to React Flow edges
  const reactFlowEdges: Edge[] = useMemo(
    () =>
      workflowConnections.map(
        (conn) =>
          ({
            id: conn.id,
            source: conn.source,
            target: conn.target,
            sourceHandle: conn.sourceHandle,
            targetHandle: conn.targetHandle,
            type: "smoothstep",
            animated: false,
            markerEnd: {
              type: "arrow",
              width: 20,
              height: 20,
            },
            style: { strokeWidth: 2 },
          }) as Edge,
      ),
    [workflowConnections],
  );

  const [nodes, setNodes, onNodesChangeFlow] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChangeFlow] = useEdgesState(reactFlowEdges);

  // Update React Flow state when workflow data changes (but prevent infinite loops)
  useEffect(() => {
    setNodes(reactFlowNodes);
  }, [workflowNodes, setNodes, errors]);

  // Handle selection changes separately to avoid re-render cycles
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: selectedNode?.id === node.id,
      })),
    );
  }, [selectedNode, setNodes]);

  useEffect(() => {
    setEdges(reactFlowEdges);
  }, [workflowConnections, setEdges]); // Update when connections change

  // Handle React Flow nodes change
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeFlow(changes);

      // Only handle position changes, ignore other React Flow internal changes
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

      // Only process position changes - don't let React Flow's internal state management
      // interfere with our workflow node array
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
      const workflowNode = workflowNodes.find((n) => n.id === node.id);
      onNodeSelect(workflowNode || null);
    },
    [workflowNodes, onNodeSelect],
  );

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    if (selectedNode === null) {
      setShowNodePalette(false);
      return; // No change if nothing is selected
    }
    onNodeSelect(null);
  }, [onNodeSelect, selectedNode]);

  const getLayoutedElements = useCallback(
    (nodes: WorkflowNode[], edges: WorkflowConnection[]) => {
      // Separate connected and disconnected nodes
      const connectedNodeIds = new Set();
      edges.forEach((edge) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const connectedNodes = nodes.filter((node) =>
        connectedNodeIds.has(node.id),
      );
      const disconnectedNodes = nodes.filter(
        (node) => !connectedNodeIds.has(node.id),
      );

      let layoutedConnectedNodes: WorkflowNode[] = [];
      let rightmostX = 0;

      // Layout connected nodes using dagre if there are any
      if (connectedNodes.length > 0) {
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));
        dagreGraph.setGraph({
          rankdir: "LR", // Left to right layout
          nodesep: 100, // Horizontal spacing between nodes
          ranksep: 100, // Vertical spacing between ranks/levels
        });

        connectedNodes.forEach((node) => {
          dagreGraph.setNode(node.id, { width: 200, height: 150 });
        });

        edges.forEach((edge) => {
          if (
            connectedNodeIds.has(edge.source) &&
            connectedNodeIds.has(edge.target)
          ) {
            dagreGraph.setEdge(edge.source, edge.target);
          }
        });

        dagre.layout(dagreGraph);

        // Apply dagre positions to connected nodes
        layoutedConnectedNodes = connectedNodes.map((node) => {
          const nodeWithPosition = dagreGraph.node(node.id);
          const newX = nodeWithPosition.x - 100; // Center the node (width/2)
          rightmostX = Math.max(rightmostX, newX);
          return {
            ...node,
            position: {
              x: newX,
              y: nodeWithPosition.y - 75, // Center the node (height/2)
            },
          };
        });
      }

      // Position disconnected nodes to the right of connected nodes
      const layoutedDisconnectedNodes = disconnectedNodes.map((node, index) => {
        return {
          ...node,
          position: {
            x: rightmostX + 300 + index * 300, // Start 300px to the right, then space by 300px
            y: 0, // Vertical spacing for multiple disconnected nodes
          },
        };
      });

      const allLayoutedNodes = [
        ...layoutedConnectedNodes,
        ...layoutedDisconnectedNodes,
      ];
      return { nodes: allLayoutedNodes, edges };
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

  const getNewNodePosition = () => {
    // Calculate position for new node (center-right of existing nodes)
    let newPosition = { x: 300, y: 100 }; // Default position for first node

    if (workflowNodes.length > 0) {
      // Find the rightmost node
      const rightmostNode = workflowNodes.reduce((rightmost, node) =>
        node.position.x > rightmost.position.x ? node : rightmost,
      );

      // Find the center Y position of all nodes
      const totalY = workflowNodes.reduce(
        (sum, node) => sum + node.position.y,
        0,
      );
      const centerY = totalY / workflowNodes.length;

      // Position new node to the right with some spacing (300px)
      newPosition = {
        x: rightmostNode.position.x + 300,
        y: centerY,
      };
    }
    return newPosition;
  };
  const createNode = (type: string, nodeType: NodeType) => {
    let defaultConfig = {};

    const newPosition = getNewNodePosition();

    const newNode: WorkflowNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: newPosition,
      data: { [nodeType + "Type"]: type, config: defaultConfig },
      inputs: nodeType === "trigger" ? [] : ["input"],
      outputs: nodeType === "condition" ? ["true", "false"] : ["output"],
    };

    const updatedNodes = [...workflowNodes, newNode];
    onNodesChange(updatedNodes);

    // Select the new node immediately after creation
    onNodeSelect(newNode);

    panToShowNode(newPosition);
  };
  const panToShowNode = (nodePosition: { x: number; y: number }) => {
    // Get the current viewport dimensions
    const canvasElement = document.querySelector(".react-flow__viewport");
    if (!canvasElement) return;

    const canvasRect = canvasElement.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;

    const node = {
      id: "temp",
      position: nodePosition,
      data: {},
      width: 200,
      height: 150,
    };
    const bounds = getNodesBounds([node]);
    const viewport = reactFlowInstance.getViewport();
    const zoom = viewport.zoom;

    const newViewport = getViewportForBounds(
      bounds,
      canvasWidth / zoom,
      canvasHeight / zoom,
      zoom, // min zoom level
      1, // max zoom level
      10, // padding
    );
    reactFlowInstance.setViewport(newViewport, {
      duration: 300,
      interpolate: "linear",
    });
  };

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      custom: CanvasNode,
    }),
    [],
  );

  useHotkeys([
    ["mod + C", () => onNodeCopy()],
    ["mod + V", () => onNodePaste()],
  ]);

  const onNodeCopy = useCallback(() => {
    if (selectedNode) {
      navigator.clipboard.writeText(JSON.stringify(selectedNode));
      NotificationService.showNotification({
        message: `Node copied to clipboard`,
        timeout: 1000,
      });
    }
  }, [selectedNode]);

  const onNodePaste = useCallback(() => {
    navigator.clipboard
      .readText()
      .then((text) => {
        const node: WorkflowNode = JSON.parse(text);
        if (node && node.id && node.type) {
          const newPosition = getNewNodePosition();

          const newNode = {
            ...node,
            id: `${node.type}-${Date.now()}`, // New unique ID
            position: newPosition,
          };
          onNodesChange([...workflowNodes, newNode]);
          onNodeSelect(newNode);
          panToShowNode(newPosition);
        }
      })
      .catch((err) => {
        console.error("Failed to read clipboard contents: ", err);
      });
  }, [workflowNodes, onNodesChange, onNodeSelect]);

  if (hasInitialized.current === false) {
    if (workflowNodes.length !== nodes.length) {
      return null; // Prevent rendering until initial fitView is done
    }
    hasInitialized.current = true;
  }

  return (
    <Box
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
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
        disableKeyboardA11y
        colorMode={colorScheme}
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
      <AddNodeList createNode={createNode} opened={showNodePalette} />
    </Box>
  );
};
