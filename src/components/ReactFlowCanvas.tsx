import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Group, Text, ActionIcon, Card, Button } from '@mantine/core';
import { IconPlus, IconTrash, IconArrowsShuffle } from '@tabler/icons-react';
import { WorkflowNode, WorkflowConnection, NODE_CATEGORIES } from '../types/workflow';
import { copyToClipboard, showNotification } from '../utils/helpers';
import dagre from '@dagrejs/dagre';

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
  const nodeData = data as WorkflowNode['data'] & WorkflowNode;
  
  const handleCopyNodeId = useCallback(async (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await copyToClipboard(nodeId);
    showNotification(`Node ID copied: ${nodeId}`);
  }, []);

  const getNodeIcon = (node: WorkflowNode) => {
    const allCategories = [...NODE_CATEGORIES.triggers, ...NODE_CATEGORIES.actions, ...NODE_CATEGORIES.conditions];
    const nodeType = node.data[node.type + 'Type'];
    const definition = allCategories.find(cat => cat.type === nodeType);
    return definition?.icon || '❓';
  };

  const getNodeLabel = (node: WorkflowNode) => {
    const allCategories = [...NODE_CATEGORIES.triggers, ...NODE_CATEGORIES.actions, ...NODE_CATEGORIES.conditions];
    const nodeType = node.data[node.type + 'Type'];
    const definition = allCategories.find(cat => cat.type === nodeType);
    return definition?.label || nodeType;
  };

  const getNodeColor = (node: WorkflowNode) => {
    switch (node.type) {
      case 'trigger': return '#e03131';
      case 'action': return '#1971c2';
      case 'condition': return '#f08c00';
      default: return '#495057';
    }
  };

  const deleteNode = () => {
    // This will be handled by the parent component
    const event = new CustomEvent('deleteNode', { detail: { nodeId: id } });
    window.dispatchEvent(event);
  };

  return (
    <Card
      style={{
        width: '200px',
        border: selected ? `2px solid ${getNodeColor(nodeData)}` : '1px solid #dee2e6',
        background: 'white',
      }}
    >
      {/* Input handles */}
      {(nodeData.inputs || []).map((input: string, index: number) => (
        <Handle
          key={input}
          type="target"
          position={Position.Left}
          id={input}
          style={{
            top: 40 + index * 20,
            background: '#495057',
            width: 16,
            height: 16,
          }}
        />
      ))}

      {/* Output handles */}
      {(nodeData.outputs || []).map((output: string, index: number) => (
        <Handle
          key={output}
          type="source"
          position={Position.Right}
          id={output}
          style={{
            top: 40 + index * 20,
            background: getNodeColor(nodeData),
            width: 16,
            height: 16,
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
                fontFamily: 'monospace', 
                cursor: 'pointer',
                userSelect: 'all'
              }}
              onClick={(e) => handleCopyNodeId(id, e)}
              title="Click to copy node ID"
            >
              {id}
            </Text>
          </div>
        </Group>
        <ActionIcon
          size="sm"
          color="red"
          variant="subtle"
          onClick={deleteNode}
        >
          <IconTrash size={14} />
        </ActionIcon>
      </Group>

      <Text size="xs" c="dimmed">
        {nodeData.type}
      </Text>
    </Card>
  );
};

export const ReactFlowCanvas: React.FC<ReactFlowCanvasProps> = ({
  nodes: workflowNodes,
  connections: workflowConnections,
  onNodesChange,
  onConnectionsChange,
  onNodeSelect,
  selectedNode
}) => {
  const [showNodePalette, setShowNodePalette] = useState(false);

  // Convert workflow nodes to React Flow nodes
  const reactFlowNodes: Node[] = useMemo(() => 
    workflowNodes.map(node => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: { ...node.data, ...node }, // Include all node data
      selected: selectedNode?.id === node.id,
    })), 
    [workflowNodes, selectedNode]
  );

  // Convert workflow connections to React Flow edges
  const reactFlowEdges: Edge[] = useMemo(() => 
    workflowConnections.map(conn => ({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      sourceHandle: conn.sourceHandle,
      targetHandle: conn.targetHandle,
      type: 'smoothstep',
      animated: false,
    })), 
    [workflowConnections]
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
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChangeFlow(changes);
    
    // Extract position changes and update workflow nodes
    const positionChanges = changes.filter((change): change is NodeChange & { type: 'position'; position: { x: number; y: number }; dragging: boolean } => 
      change.type === 'position' && 'position' in change && 'dragging' in change && !change.dragging
    );
    
    if (positionChanges.length > 0) {
      const updatedNodes = workflowNodes.map(node => {
        const positionChange = positionChanges.find(change => change.id === node.id);
        if (positionChange) {
          return { ...node, position: positionChange.position };
        }
        return node;
      });
      
      onNodesChange(updatedNodes);
    }
  }, [onNodesChangeFlow, workflowNodes, onNodesChange]);

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const newConnection: WorkflowConnection = {
        id: `conn-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle || 'output',
        targetHandle: params.targetHandle || 'input',
      };

      onConnectionsChange([...workflowConnections, newConnection]);
    },
    [workflowConnections, onConnectionsChange]
  );

  // Handle edge deletion
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChangeFlow(changes);
    
    // Handle edge removals
    changes.forEach((change) => {
      if (change.type === 'remove') {
        const updatedConnections = workflowConnections.filter(c => c.id !== change.id);
        onConnectionsChange(updatedConnections);
      }
    });
  }, [onEdgesChangeFlow, workflowConnections, onConnectionsChange]);

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const workflowNode = workflowNodes.find(n => n.id === node.id);
    onNodeSelect(workflowNode || null);
  }, [workflowNodes, onNodeSelect]);

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  // Handle node deletion
  React.useEffect(() => {
    const handleDeleteNode = (event: CustomEvent) => {
      const { nodeId } = event.detail;
      const updatedNodes = workflowNodes.filter(n => n.id !== nodeId);
      const updatedConnections = workflowConnections.filter(c => 
        c.source !== nodeId && c.target !== nodeId
      );
      onNodesChange(updatedNodes);
      onConnectionsChange(updatedConnections);
      if (selectedNode?.id === nodeId) {
        onNodeSelect(null);
      }
    };

    window.addEventListener('deleteNode', handleDeleteNode as EventListener);
    return () => window.removeEventListener('deleteNode', handleDeleteNode as EventListener);
  }, [workflowNodes, workflowConnections, onNodesChange, onConnectionsChange, selectedNode, onNodeSelect]);

  const getLayoutedElements = useCallback((nodes: WorkflowNode[], edges: WorkflowConnection[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 200, height: 150 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    // Get connected nodes from dagre
    const connectedNodes = new Set();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    // Position disconnected nodes horizontally
    const disconnectedNodes = nodes.filter(node => !connectedNodes.has(node.id));
    let maxX = 0;
    
    // Find the rightmost position of connected nodes
    nodes.forEach((node) => {
      if (connectedNodes.has(node.id)) {
        const nodeWithPosition = dagreGraph.node(node.id);
        maxX = Math.max(maxX, nodeWithPosition.x + 100);
      }
    });

    const newNodes = nodes.map((node) => {
      if (connectedNodes.has(node.id)) {
        // Use dagre positioning for connected nodes
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 100,
            y: nodeWithPosition.y - 75,
          },
        };
      } else {
        // Position disconnected nodes horizontally to the right
        const disconnectedIndex = disconnectedNodes.findIndex(n => n.id === node.id);
        return {
          ...node,
          position: {
            x: maxX + 250 + (disconnectedIndex * 250),
            y: 100,
          },
        };
      }
    });

    return { nodes: newNodes, edges };
  }, []);

  const autoArrange = useCallback(() => {
    const { nodes: layoutedNodes } = getLayoutedElements(workflowNodes, workflowConnections, 'LR');
    onNodesChange(layoutedNodes);
  }, [workflowNodes, workflowConnections, onNodesChange, getLayoutedElements]);

  const createNode = (type: string, category: 'triggers' | 'actions' | 'conditions') => {
    const nodeType = category.slice(0, -1) as 'trigger' | 'action' | 'condition';
    let defaultConfig = {};
    
    if (nodeType === 'action' && type === 'inject-component') {
      defaultConfig = {
        componentType: 'button',
        componentText: 'Button',
        targetSelector: 'body'
      };
    }
    
    const newNode: WorkflowNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: 0, y: 0 }, // Temporary position, will be updated by layout
      data: { [nodeType + 'Type']: type, config: defaultConfig },
      inputs: category === 'triggers' ? [] : ['input'],
      outputs: category === 'conditions' ? ['true', 'false'] : ['output']
    };

    const updatedNodes = [...workflowNodes, newNode];
    
    // Auto-arrange after adding the new node
    const { nodes: layoutedNodes } = getLayoutedElements(updatedNodes, workflowConnections, 'LR');
    onNodesChange(layoutedNodes);
    setShowNodePalette(false);
  };

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    []
  );

  return (
    <Box style={{ position: 'relative', width: '100%', height: '600px' }}>
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
          type: 'smoothstep',
          animated: false,
        }}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Auto-arrange Button */}
      <Button
        leftSection={<IconArrowsShuffle size={16} />}
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 1000 }}
        onClick={autoArrange}
        variant="subtle"
      >
        Auto Arrange
      </Button>

      {/* Add Node Button */}
      <Button
        leftSection={<IconPlus size={16} />}
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}
        onClick={() => setShowNodePalette(!showNodePalette)}
      >
        Add Node
      </Button>

      {/* Node Palette */}
      {showNodePalette && (
        <Card
          style={{
            position: 'absolute',
            top: 60,
            right: 16,
            width: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          <Text fw={500} mb="md">Add Node</Text>
          
          {Object.entries(NODE_CATEGORIES).map(([category, items]) => (
            <div key={category}>
              <Text size="sm" fw={500} c="dimmed" tt="capitalize" mb="xs">
                {category}
              </Text>
              {items.map(item => (
                <Button
                  key={item.type}
                  variant="subtle"
                  fullWidth
                  justify="start"
                  leftSection={<Text size="lg">{item.icon}</Text>}
                  mb="xs"
                  onClick={() => createNode(item.type, category as any)}
                >
                  <div>
                    <Text size="sm">{item.label}</Text>
                    <Text size="xs" c="dimmed">{item.description}</Text>
                  </div>
                </Button>
              ))}
            </div>
          ))}
        </Card>
      )}
    </Box>
  );
};