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

export const getLayoutedElementsCallback = () =>
  useCallback((nodes: WorkflowNode[], edges: WorkflowConnection[]) => {
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
        nodesep: 100, // Increased horizontal spacing between nodes
        ranksep: 100, // Increased vertical spacing between ranks/levels
        marginx: 20, // Margin around the graph
        marginy: 20,
        acyclicer: "greedy", // Algorithm for handling cycles
        ranker: "network-simplex", // Try tight-tree for better crossing reduction
      });

      connectedNodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 200, height: 150 });
      });

      // Sort edges by handle index to process in order
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
        // Add edge with weight based on handle to influence layout
        const sourceNode = connectedNodes.find((n) => n.id === edge.source);
        const handleIndex =
          sourceNode?.outputs?.indexOf(edge.sourceHandle || "output") || 0;

        dagreGraph.setEdge(edge.source, edge.target, {
          weight: Math.max(1, 15 - handleIndex * 5), // Even stronger weight difference
          minlen: 1 + handleIndex, // Minimum edge length based on handle position
        });
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
  }, []);

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
