import React, { useCallback, useMemo, useEffect, useState } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeCatalog } from "@/services/nodeCatalog";
import {
  Box,
  ActionIcon,
  Tooltip,
  useComputedColorScheme,
  Group,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconLayoutGrid,
} from "@tabler/icons-react";
import { WorkflowNode, WorkflowConnection, NodeType } from "@/types/workflow";
import CanvasNode from "./CanvasNode";
import CanvasEdge from "./CanvasEdge";
import { useHotkeys } from "@mantine/hooks";
import AddNodeList from "./AddNodeList";
import { generateId } from "@/utils/helpers";
import { generateDefaultConfig } from "@/types/config-properties";
import {
  getLayoutedElementsCallback,
  getNewNodePosition,
  onNodePasteCallback,
  panToShowNodeCallback,
} from "./ReactFlowCanvasCallbacks";

interface ReactFlowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  onNodeSelect: (id: string | null) => void;
  onNodeDelete: (id: string) => void;
  onNodeMove: (id: string, position: { x: number; y: number }) => void;
  onConnectionCreate: (connection: WorkflowConnection) => void;
  onConnectionDelete: (id: string) => void;
  onNodeCreate: (node: WorkflowNode, connection?: WorkflowConnection) => void;
  onNodeDuplicate: (nodeId: string, position: { x: number; y: number }) => void;
  onBatchUpdateNodePositions: (
    positions: Record<string, { x: number; y: number }>,
  ) => void;
  selectedNodeId: string | null;
  onCopySelectedNode: () => void;
  errors: Record<string, Record<string, string[]>>;
  undo: () => void;
  redo: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PendingConnection {
  sourceNodeId: string;
  sourceHandle: string;
}

export const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = (props) => {
  useEffect(() => {
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
  onNodeSelect,
  onNodeDelete,
  onNodeMove,
  onConnectionCreate,
  onConnectionDelete,
  onNodeCreate,
  onNodeDuplicate,
  onBatchUpdateNodePositions,
  selectedNodeId,
  onCopySelectedNode,
  errors,
  undo,
  redo,
  hasNext,
  hasPrevious,
}) => {
  const colorScheme = useComputedColorScheme();
  const reactFlowInstance = useReactFlow();
  const [opened, setOpened] = useState(false);
  const [pendingConnection, setPendingConnection] =
    useState<PendingConnection | null>(null);
  const panToShowNode = panToShowNodeCallback(reactFlowInstance);
  const lastActionNodeId = useMemo(() => {
    for (let index = workflowNodes.length - 1; index >= 0; index -= 1) {
      return workflowNodes[index].id;
    }

    return null;
  }, [workflowNodes]);

  // Convert workflow nodes to React Flow nodes
  const reactFlowNodes: Node[] = useMemo(() => {
    return workflowNodes.map((node) => ({
      id: node.id,
      type: "custom",
      position: node.position,
      selected: selectedNodeId === node.id,
      data: {
        ...node.data,
        ...node,
        onDeleteNode: onNodeDelete,
        alwaysShowAddButton: node.id === lastActionNodeId,
        onAddNodeFromHandle: (sourceNodeId: string, sourceHandle: string) => {
          setPendingConnection({ sourceNodeId, sourceHandle });
          onNodeSelect(null);
          setOpened(true);
        },
        onCopyNode: () => {
          const newPosition = getNewNodePosition(workflowNodes);
          onNodeDuplicate(node.id, newPosition);
        },
        error: errors[node.id] !== undefined,
      },
    }));
  }, [
    workflowNodes, // This is already optimized to only change on structural changes
    selectedNodeId,
    errors,
    lastActionNodeId,
    onNodeDelete,
    onNodeDuplicate,
    onNodeSelect,
  ]);

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
            type: "custom",
            animated: false,
            markerEnd: {
              type: "arrow",
              width: 20,
              height: 20,
            },
            data: {
              onDelete: onConnectionDelete,
            },
          }) as Edge,
      ),
    [workflowConnections, onConnectionDelete],
  );

  const [nodes, setNodes, onNodesChangeFlow] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChangeFlow] = useEdgesState(reactFlowEdges);

  // Update React Flow state only when structure changes (not just config updates)
  useEffect(() => {
    const updateState = () => {
      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
    };
    const frameId = requestAnimationFrame(updateState);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [reactFlowNodes, reactFlowEdges]);

  useEffect(() => {
    if (opened && selectedNodeId !== null) setOpened(false);
  }, [selectedNodeId, opened]);

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
        positionChanges.forEach((change) => {
          onNodeMove(change.id, change.position);
        });
      }
    },
    [onNodesChangeFlow, onNodeMove],
  );

  // Create a Set of existing connections for efficient duplicate checking
  const existingConnections = useMemo(() => {
    return new Set(
      workflowConnections.map(
        (conn) =>
          `${conn.source}:${conn.sourceHandle || "output"}:${conn.target}:${conn.targetHandle || "input"}`,
      ),
    );
  }, [workflowConnections]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      // Check if connection already exists using Set
      const connectionKey = `${params.source}:${params.sourceHandle || "output"}:${params.target}:${params.targetHandle || "input"}`;

      if (existingConnections.has(connectionKey)) {
        return; // Duplicate connection, don't create
      }

      const newConnection: WorkflowConnection = {
        id: generateId("conn"),
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || "output",
        targetHandle: params.targetHandle || "input",
      };

      onConnectionCreate(newConnection);
    },
    [existingConnections, onConnectionCreate],
  );

  // Handle edge deletion
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeFlow(changes);

      // Handle edge removals
      if (changes.length > 0) {
        changes.forEach((change) => {
          if (change.type === "remove") {
            onConnectionDelete(change.id);
          }
        });
      }
    },
    [onEdgesChangeFlow, onConnectionDelete],
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node.id);
    },
    [workflowNodes, onNodeSelect],
  );

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    setOpened(false);
    // do nothing if no change
    if (selectedNodeId === null) return;
    onNodeSelect(null);
  }, [selectedNodeId, onNodeSelect]);

  const getLayoutedElements = getLayoutedElementsCallback();

  const autoArrange = useCallback(() => {
    const { nodes: layoutedNodes } = getLayoutedElements(
      workflowNodes,
      workflowConnections,
    );

    // Create position updates record
    const positionUpdates: Record<string, { x: number; y: number }> = {};
    layoutedNodes.forEach((node) => {
      positionUpdates[node.id] = node.position;
    });

    onBatchUpdateNodePositions(positionUpdates);
  }, [
    workflowNodes,
    workflowConnections,
    getLayoutedElements,
    onBatchUpdateNodePositions,
  ]);

  const createNode = useCallback(
    (type: string, nodeType: NodeType) => {
      let defaultConfig: Record<string, any> = {};
      let outputs: string[] = ["output"];

      if (nodeType === "trigger") {
        const def = nodeCatalog.triggers[type];
        if (def) {
          defaultConfig = generateDefaultConfig(def.configSchema);
        }
      } else if (nodeType === "action") {
        const def = nodeCatalog.actions[type];
        if (def) {
          defaultConfig = generateDefaultConfig(def.configSchema);
          if (def.metadata.outputs) {
            outputs = Array.from(def.metadata.outputs);
          }
        }
      }

      const newPosition = getNewNodePosition(workflowNodes);

      const newNode: WorkflowNode = {
        id: generateId(nodeType),
        type: nodeType,
        position: newPosition,
        data: { type, config: defaultConfig },
        inputs: nodeType === "trigger" ? [] : ["input"],
        outputs,
      };

      const newConnection = pendingConnection
        ? {
            id: generateId("conn"),
            source: pendingConnection.sourceNodeId,
            target: newNode.id,
            sourceHandle: pendingConnection.sourceHandle,
            targetHandle: "input",
          }
        : undefined;

      onNodeCreate(newNode, newConnection);

      if (newConnection) {
        setPendingConnection(null);
      }

      panToShowNode(newPosition);
    },
    [workflowNodes, onNodeCreate, pendingConnection],
  );

  const onNodePaste = onNodePasteCallback({
    workflowNodes,
    onNodeCreate,
    panToShowNode,
  });

  useHotkeys([
    ["mod + C", () => onCopySelectedNode()],
    ["mod + V", () => onNodePaste()],
    ["mod + Z", () => hasPrevious && undo()],
    ["mod + Shift + Z", () => hasNext && redo()],
    ["mod + Y", () => hasNext && redo()],
  ]);

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
        onNodesDelete={(deleted) => {
          onNodeDelete(deleted[0].id);
        }}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={{
          custom: CanvasNode,
        }}
        edgeTypes={{
          custom: CanvasEdge,
        }}
        connectionLineType={ConnectionLineType.Bezier}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        fitView
        fitViewOptions={{
          padding: 0.1,
          minZoom: 1,
          maxZoom: 1,
        }}
        disableKeyboardA11y
        colorMode={colorScheme}
        onlyRenderVisibleElements={false}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <Group
        style={{ position: "absolute", top: 16, left: 16, zIndex: 1000 }}
        gap="xs"
      >
        <Tooltip label="Auto-arrange nodes">
          <ActionIcon onClick={autoArrange} variant="subtle">
            <IconLayoutGrid />
          </ActionIcon>
        </Tooltip>
        <ActionIcon
          onClick={() => undo()}
          variant="subtle"
          bg={hasPrevious ? undefined : "transparent"}
          disabled={!hasPrevious}
        >
          <IconArrowBackUp />
        </ActionIcon>
        <ActionIcon
          onClick={() => redo()}
          variant="subtle"
          bg={hasNext ? undefined : "transparent"}
          disabled={!hasNext}
        >
          <IconArrowForwardUp />
        </ActionIcon>
      </Group>

      {/* Add Node Button */}
      <AddNodeList
        createNode={createNode}
        opened={opened}
        prioritizeActions={pendingConnection !== null}
        onChange={(value) => {
          setOpened(value);
          if (!value) {
            setPendingConnection(null);
          }
        }}
      />
    </Box>
  );
};
