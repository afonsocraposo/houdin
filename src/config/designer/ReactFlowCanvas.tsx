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
import { ActionRegistry } from "@/services/actionRegistry";
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
import { initializeTriggers } from "@/services/triggerInitializer";
import { initializeActions } from "@/services/actionInitializer";
import CanvasNode from "./CanvasNode";
import CanvasEdge from "./CanvasEdge";
import { useHotkeys } from "@mantine/hooks";
import AddNodeList from "./AddNodeList";
import { generateId } from "@/utils/helpers";
import {
  getLayoutedElementsCallback,
  getNewNodePosition,
  onNodeCopyCallback,
  onNodePasteCallback,
  panToShowNodeCallback,
} from "./ReactFlowCanvasCallbacks";

interface ReactFlowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  setNodes: (nodes: WorkflowNode[]) => void;
  onNodeSelect: (id: string | null) => void;
  onNodeDelete: (id: string) => void;
  onNodeMove: (id: string, position: { x: number; y: number }) => void;
  onConnectionCreate: (connection: WorkflowConnection) => void;
  onConnectionDelete: (id: string) => void;
  onNodeCreate: (node: WorkflowNode) => void;
  selectedNode: WorkflowNode | null;
  errors: Record<string, Record<string, string[]>>;
  undo: () => void;
  redo: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
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
  setNodes: setWorkflowNodes,
  onNodeSelect,
  onNodeDelete,
  onNodeMove,
  onConnectionCreate,
  onConnectionDelete,
  onNodeCreate,
  selectedNode,
  errors,
  undo,
  redo,
  hasNext,
  hasPrevious,
}) => {
  const colorScheme = useComputedColorScheme();
  const reactFlowInstance = useReactFlow();
  const [opened, setOpened] = useState(false);


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
          onDeleteNode: onNodeDelete,
          error: errors[node.id] !== undefined,
        },
      })),
    [workflowNodes, errors, onNodeDelete],
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

  // Update React Flow state when workflow data changes (but prevent infinite loops)
  useEffect(() => {
    // Use requestAnimationFrame to ensure the update happens after ReactFlow's internal updates
    const updateNodes = () => {
      setNodes(reactFlowNodes);
    };
    requestAnimationFrame(updateNodes);
  }, [reactFlowNodes, setNodes]);

  useEffect(() => {
    // Use requestAnimationFrame to ensure the update happens after ReactFlow's internal updates
    const updateEdges = () => {
      setEdges(reactFlowEdges);
    };
    requestAnimationFrame(updateEdges);
  }, [reactFlowEdges, setEdges]);

  // Handle selection changes separately to avoid re-render cycles
  // Only update if we actually have nodes to prevent interference with undo/redo
  useEffect(() => {
    if (nodes.length > 0) {
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,
          selected: selectedNode?.id === node.id,
        })),
      );
    }
    setOpened(false);
  }, [selectedNode?.id, setNodes, setOpened, nodes.length]);

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
    if (selectedNode === null) return;
    onNodeSelect(null);
  }, [selectedNode, onNodeSelect]);

  const getLayoutedElements = getLayoutedElementsCallback();

  const autoArrange = useCallback(() => {
    const { nodes: layoutedNodes } = getLayoutedElements(
      workflowNodes,
      workflowConnections,
    );
    setWorkflowNodes(layoutedNodes);
  }, [workflowNodes, workflowConnections, getLayoutedElements]);

  const createNode = useCallback(
    (type: string, nodeType: NodeType) => {
      let defaultConfig = {};
      let outputs: string[] = ["output"]; // default

      // Get outputs from metadata
      if (nodeType === "action") {
        const actionRegistry = ActionRegistry.getInstance();
        const action = actionRegistry.getAction(type);
        if (action?.metadata.outputs) {
          outputs = Array.from(action.metadata.outputs);
        }
      } else if (nodeType === "trigger") {
        outputs = ["output"]; // triggers always have single output
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

      onNodeCreate(newNode);

      panToShowNode(newPosition);
    },
    [workflowNodes, onNodeCreate],
  );

  const panToShowNode = panToShowNodeCallback(reactFlowInstance);

  const onNodeCopy = onNodeCopyCallback(selectedNode);

  const onNodePaste = onNodePasteCallback({
    workflowNodes,
    onNodeCreate,
    panToShowNode,
  });

  useHotkeys([
    ["mod + C", () => onNodeCopy()],
    ["mod + V", () => onNodePaste()],
    ["mod + Z", () => hasPrevious && undo()],
    ["mod + Shift + Z", () => hasNext && redo()],
  ]);

  console.log("flow", nodes, edges);
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
        onChange={(value) => setOpened(value)}
      />
    </Box>
  );
};
