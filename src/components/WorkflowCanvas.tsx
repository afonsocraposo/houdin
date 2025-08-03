import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Box, Group, Text, ActionIcon, Card, Button } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { WorkflowNode, WorkflowConnection, NODE_CATEGORIES } from '../types/workflow';
import { copyToClipboard, showNotification } from '../utils/helpers';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onConnectionsChange: (connections: WorkflowConnection[]) => void;
  onNodeSelect: (node: WorkflowNode | null) => void;
  selectedNode: WorkflowNode | null;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  connections,
  onNodesChange,
  onConnectionsChange,
  onNodeSelect,
  selectedNode
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedNode, setDraggedNode] = useState<WorkflowNode | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [connectionMode, setConnectionMode] = useState<{
    sourceNodeId: string;
    sourceHandle: string;
    isConnecting: boolean;
  } | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);

  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedNode(node);
    onNodeSelect(node);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggedNode && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const newPosition = {
        x: e.clientX - canvasRect.left - dragOffset.x,
        y: e.clientY - canvasRect.top - dragOffset.y
      };

      const updatedNodes = nodes.map(n => 
        n.id === draggedNode.id 
          ? { ...n, position: newPosition }
          : n
      );
      onNodesChange(updatedNodes);
    }

    // Handle connection dragging
    if (connectionMode?.isConnecting && canvasRef.current) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      setTempConnection({
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top
      });
    }
  }, [draggedNode, dragOffset, nodes, onNodesChange, connectionMode]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
    if (connectionMode?.isConnecting) {
      setConnectionMode(null);
      setTempConnection(null);
    }
  }, [connectionMode]);

  useEffect(() => {
    if (draggedNode) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedNode, handleMouseMove, handleMouseUp]);

  const createNode = (type: string, category: 'triggers' | 'actions' | 'conditions') => {
    const nodeType = category.slice(0, -1) as 'trigger' | 'action' | 'condition'
    let defaultConfig = {}
    
    // Set default configuration based on node type
    if (nodeType === 'action' && type === 'inject-component') {
      defaultConfig = {
        componentType: 'button',
        componentText: 'Button',
        targetSelector: 'body'
      }
    }
    
    const newNode: WorkflowNode = {
      id: `${nodeType}-${Date.now()}`,
      type: nodeType,
      position: { x: 100, y: 100 },
      data: { [nodeType + 'Type']: type, config: defaultConfig },
      inputs: category === 'triggers' ? [] : ['input'],
      outputs: category === 'conditions' ? ['true', 'false'] : ['output']
    };

    onNodesChange([...nodes, newNode]);
    setShowNodePalette(false);
  };

  const handleCopyNodeId = useCallback(async (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent node selection
    await copyToClipboard(nodeId);
    showNotification(`Node ID copied: ${nodeId}`);
  }, []);

  const deleteNode = (nodeId: string) => {
    const updatedNodes = nodes.filter(n => n.id !== nodeId);
    const updatedConnections = connections.filter(c => c.source !== nodeId && c.target !== nodeId);
    onNodesChange(updatedNodes);
    onConnectionsChange(updatedConnections);
    if (selectedNode?.id === nodeId) {
      onNodeSelect(null);
    }
  };

  const handleConnectionStart = (nodeId: string, handle: string, isOutput: boolean) => {
    if (isOutput) {
      setConnectionMode({
        sourceNodeId: nodeId,
        sourceHandle: handle,
        isConnecting: true
      });
    }
  };

  const handleConnectionEnd = (nodeId: string, handle: string, isOutput: boolean) => {
    if (connectionMode && !isOutput && connectionMode.sourceNodeId !== nodeId) {
      const sourceNode = nodes.find(n => n.id === connectionMode.sourceNodeId);
      const targetNode = nodes.find(n => n.id === nodeId);
      
      if (!sourceNode || !targetNode) return;

      // Connection validation rules
      const isValidConnection = validateConnection(sourceNode, targetNode, connectionMode.sourceHandle, handle);
      
      if (isValidConnection) {
        // Create new connection
        const newConnection: WorkflowConnection = {
          id: `conn-${Date.now()}`,
          source: connectionMode.sourceNodeId,
          target: nodeId,
          sourceHandle: connectionMode.sourceHandle,
          targetHandle: handle
        };

        // Check if connection already exists
        const existingConnection = connections.find(c => 
          c.source === newConnection.source && 
          c.target === newConnection.target &&
          c.sourceHandle === newConnection.sourceHandle &&
          c.targetHandle === newConnection.targetHandle
        );

        if (!existingConnection) {
          onConnectionsChange([...connections, newConnection]);
        }
      }
      
      setConnectionMode(null);
      setTempConnection(null);
    }
  };

  const validateConnection = (sourceNode: WorkflowNode, targetNode: WorkflowNode, _sourceHandle: string, targetHandle: string): boolean => {
    // Rule 1: Cannot connect to same node
    if (sourceNode.id === targetNode.id) return false;
    
    // Rule 2: Triggers can only connect to actions or conditions
    if (sourceNode.type === 'trigger' && targetNode.type === 'trigger') return false;
    
    // Rule 3: Actions cannot connect to triggers
    if (sourceNode.type === 'action' && targetNode.type === 'trigger') return false;
    
    // Rule 4: Check for circular dependencies (basic check)
    const wouldCreateCycle = checkForCycle(sourceNode.id, targetNode.id, connections);
    if (wouldCreateCycle) return false;
    
    // Rule 5: Each input can only have one connection
    const inputAlreadyConnected = connections.some(c => 
      c.target === targetNode.id && c.targetHandle === targetHandle
    );
    if (inputAlreadyConnected) return false;
    
    return true;
  };

  const checkForCycle = (sourceId: string, targetId: string, existingConnections: WorkflowConnection[]): boolean => {
    // Simple cycle detection - check if target already connects back to source
    const visited = new Set<string>();
    const stack = [targetId];
    
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;
      if (currentId === sourceId) return true;
      
      visited.add(currentId);
      
      // Find all nodes that this node connects to
      const outgoingConnections = existingConnections.filter(c => c.source === currentId);
      outgoingConnections.forEach(conn => stack.push(conn.target));
    }
    
    return false;
  };

  const deleteConnection = (connectionId: string) => {
    const updatedConnections = connections.filter(c => c.id !== connectionId);
    onConnectionsChange(updatedConnections);
  };

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

  return (
    <Box style={{ position: 'relative', width: '100%', height: '600px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px' }}>
      {/* Canvas */}
      <div 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%', 
          position: 'relative', 
          overflow: 'hidden',
          cursor: connectionMode?.isConnecting ? 'crosshair' : 'default'
        }}
        onClick={() => {
          onNodeSelect(null);
          if (connectionMode?.isConnecting) {
            setConnectionMode(null);
            setTempConnection(null);
          }
        }}
      >
        {/* Connection lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {connections.map(connection => {
            const sourceNode = nodes.find(n => n.id === connection.source);
            const targetNode = nodes.find(n => n.id === connection.target);
            
            if (!sourceNode || !targetNode) return null;

            const x1 = sourceNode.position.x + 200; // Right edge of source node
            const y1 = sourceNode.position.y + 30; // Center of source node
            const x2 = targetNode.position.x; // Left edge of target node
            const y2 = targetNode.position.y + 30; // Center of target node

            // Create curved path for better visuals
            const midX = (x1 + x2) / 2;
            const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

            return (
              <g key={connection.id}>
                <path
                  d={path}
                  stroke="#495057"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  style={{ cursor: 'pointer' }}
                  onClick={() => deleteConnection(connection.id)}
                />
              </g>
            );
          })}

          {/* Temporary connection line while dragging */}
          {connectionMode?.isConnecting && tempConnection && (
            (() => {
              const sourceNode = nodes.find(n => n.id === connectionMode.sourceNodeId);
              if (!sourceNode) return null;

              const x1 = sourceNode.position.x + 200;
              const y1 = sourceNode.position.y + 30;
              const x2 = tempConnection.x;
              const y2 = tempConnection.y;

              const midX = (x1 + x2) / 2;
              const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

              return (
                <path
                  d={path}
                  stroke="#228be6"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  markerEnd="url(#arrowhead-blue)"
                />
              );
            })()
          )}
          
          {/* Arrow marker definitions */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#495057" />
            </marker>
            <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#228be6" />
            </marker>
          </defs>
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <Card
            key={node.id}
            style={{
              position: 'absolute',
              left: node.position.x,
              top: node.position.y,
              width: '200px',
              cursor: 'move',
              zIndex: 2,
              border: selectedNode?.id === node.id ? `2px solid ${getNodeColor(node)}` : '1px solid #dee2e6',
              background: 'white'
            }}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
            onClick={(e) => e.stopPropagation()}
          >
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <Text size="lg">{getNodeIcon(node)}</Text>
                <div>
                  <Text size="sm" fw={500} c={getNodeColor(node)}>
                    {getNodeLabel(node)}
                  </Text>
                  <Text size="xs" c="dimmed" style={{ 
                    fontFamily: 'monospace', 
                    cursor: 'pointer',
                    userSelect: 'all'
                  }}
                  onClick={(e) => handleCopyNodeId(node.id, e)}
                  title="Click to copy node ID">
                    {node.id}
                  </Text>
                </div>
              </Group>
              <ActionIcon
                size="sm"
                color="red"
                variant="subtle"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNode(node.id);
                }}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Group>

            {/* Input connection points */}
            {(node.inputs || []).map((input, index) => {
              const isConnected = connections.some(c => c.target === node.id && c.targetHandle === input);
              const canConnect = connectionMode?.isConnecting && 
                connectionMode.sourceNodeId !== node.id &&
                !isConnected;
              
              return (
                <div
                  key={input}
                  style={{
                    position: 'absolute',
                    left: -8,
                    top: 30 + index * 20,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: isConnected ? '#40c057' : (canConnect ? '#228be6' : '#495057'),
                    cursor: 'crosshair',
                    border: '2px solid white',
                    zIndex: 3,
                    transform: canConnect ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleConnectionStart(node.id, input, false);
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    handleConnectionEnd(node.id, input, false);
                  }}
                  title={`Input: ${input}${isConnected ? ' (connected)' : ''}`}
                />
              );
            })}

            {/* Output connection points */}
            {(node.outputs || []).map((output, index) => {
              const isActive = connectionMode?.sourceNodeId === node.id && connectionMode?.sourceHandle === output;
              
              return (
                <div
                  key={output}
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: 30 + index * 20,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: isActive ? '#228be6' : getNodeColor(node),
                    cursor: 'crosshair',
                    border: '2px solid white',
                    zIndex: 3,
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleConnectionStart(node.id, output, true);
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    handleConnectionEnd(node.id, output, true);
                  }}
                  title={`Output: ${output}`}
                />
              );
            })}

            <Text size="xs" c="dimmed">
              {node.type}
            </Text>
          </Card>
        ))}
      </div>

      {/* Add Node Button */}
      <Button
        leftSection={<IconPlus size={16} />}
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 3 }}
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
            zIndex: 4
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