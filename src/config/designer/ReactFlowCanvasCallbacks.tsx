import { NotificationService } from "@/services/notification";
import { WorkflowConnection, WorkflowNode } from "@/types/workflow";
import { generateId } from "@/utils/helpers";
import { useCallback } from "react";
import dagre from "@dagrejs/dagre";
import {
  getNodesBounds,
  getViewportForBounds,
  ReactFlowInstance,
} from "@xyflow/react";

export function getLayoutedElements(
  nodes: WorkflowNode[],
  edges: WorkflowConnection[],
) {
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const connectedNodes = nodes.filter((node) => connectedNodeIds.has(node.id));
  const disconnectedNodes = nodes.filter(
    (node) => !connectedNodeIds.has(node.id),
  );

  let layoutedConnectedNodes: WorkflowNode[] = [];
  let rightmostX = 0;

  if (connectedNodes.length > 0) {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: "LR",
      nodesep: 100,
      ranksep: 100,
      marginx: 20,
      marginy: 20,
      acyclicer: "greedy",
      ranker: "network-simplex",
    });

    connectedNodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 200, height: 150 });
    });

    const sortedEdges = edges
      .filter(
        (edge) =>
          connectedNodeIds.has(edge.source) &&
          connectedNodeIds.has(edge.target),
      )
      .sort((a, b) => {
        const sourceNodeA = connectedNodes.find((n) => n.id === a.source);
        const sourceNodeB = connectedNodes.find((n) => n.id === b.source);
        const handleIndexA =
          sourceNodeA?.outputs?.indexOf(a.sourceHandle || "output") || 0;
        const handleIndexB =
          sourceNodeB?.outputs?.indexOf(b.sourceHandle || "output") || 0;
        return handleIndexA - handleIndexB;
      });

    sortedEdges.forEach((edge) => {
      const sourceNode = connectedNodes.find((n) => n.id === edge.source);
      const handleIndex =
        sourceNode?.outputs?.indexOf(edge.sourceHandle || "output") || 0;

      dagreGraph.setEdge(edge.source, edge.target, {
        weight: Math.max(1, 15 - handleIndex * 5),
        minlen: 1 + handleIndex,
      });
    });

    dagre.layout(dagreGraph);

    layoutedConnectedNodes = connectedNodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const newX = nodeWithPosition.x - 100;
      rightmostX = Math.max(rightmostX, newX);
      return {
        ...node,
        position: {
          x: newX,
          y: nodeWithPosition.y - 75,
        },
      };
    });
  }

  const layoutedDisconnectedNodes = disconnectedNodes.map((node, index) => ({
    ...node,
    position: {
      x: rightmostX + 300 + index * 300,
      y: 0,
    },
  }));

  return {
    nodes: [...layoutedConnectedNodes, ...layoutedDisconnectedNodes],
    edges,
  };
}

export const getLayoutedElementsCallback = () =>
  useCallback(
    (nodes: WorkflowNode[], edges: WorkflowConnection[]) =>
      getLayoutedElements(nodes, edges),
    [],
  );

export const onNodeDuplicateCallback = ({
  workflowNodes,
  onNodeCreate,
  panToShowNode,
}: {
  workflowNodes: WorkflowNode[];
  onNodeCreate: (newNode: WorkflowNode) => void;
  panToShowNode: (position: { x: number; y: number }) => void;
}) =>
  useCallback(
    (node: WorkflowNode) => {
      if (node && node.id && node.type) {
        const newPosition = getNewNodePosition(workflowNodes);

        const newNode = {
          ...node,
          id: generateId(node.type), // New unique ID
          position: newPosition,
        };
        onNodeCreate(newNode);
        panToShowNode(newPosition);
      }
    },
    [workflowNodes, onNodeCreate, panToShowNode],
  );

export const onNodeCopyCallback = (selectedNode: WorkflowNode | null) =>
  useCallback(() => {
    if (selectedNode) {
      navigator.clipboard.writeText(JSON.stringify(selectedNode));
      NotificationService.showNotification({
        message: `Node copied to clipboard`,
        timeout: 1000,
      });
    }
  }, [selectedNode]);

export const onNodePasteCallback = ({
  workflowNodes,
  onNodeCreate,
  panToShowNode,
}: {
  workflowNodes: WorkflowNode[];
  onNodeCreate: (newNode: WorkflowNode) => void;
  panToShowNode: (position: { x: number; y: number }) => void;
}) =>
  useCallback(() => {
    navigator.clipboard
      .readText()
      .then((text) => {
        const node: WorkflowNode = JSON.parse(text);
        if (node && node.id && node.type) {
          const newPosition = getNewNodePosition(workflowNodes);

          const newNode = {
            ...node,
            id: generateId(node.type), // New unique ID
            position: newPosition,
          };
          onNodeCreate(newNode);
          panToShowNode(newPosition);
        }
      })
      .catch((err) => {
        console.error("Failed to read clipboard contents: ", err);
      });
  }, [workflowNodes]);

export const getNewNodePosition = (workflowNodes: WorkflowNode[]) => {
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

export const panToShowNodeCallback = (reactFlowInstance: ReactFlowInstance) =>
  useCallback(
    (nodePosition: { x: number; y: number }) => {
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
    },
    [reactFlowInstance],
  );
