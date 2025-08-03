import React, { useState } from 'react';
import { Container, Title, Grid, Stack, Button, Group, TextInput, Switch, Card, Text } from '@mantine/core';
import { IconDeviceFloppy, IconPlayerPlay, IconArrowLeft } from '@tabler/icons-react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodeProperties } from './NodeProperties';
import { WorkflowNode, WorkflowConnection, WorkflowDefinition } from '../types/workflow';

interface WorkflowDesignerProps {
  workflow?: WorkflowDefinition;
  onSave: (workflow: WorkflowDefinition) => void;
  onCancel: () => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  workflow,
  onSave,
  onCancel
}) => {
  const [workflowName, setWorkflowName] = useState(workflow?.name || '');
  const [workflowDescription, setWorkflowDescription] = useState(workflow?.description || '');
  const [workflowEnabled, setWorkflowEnabled] = useState(workflow?.enabled ?? true);
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow?.nodes || []);
  const [connections, setConnections] = useState<WorkflowConnection[]>(workflow?.connections || []);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

  const handleNodeUpdate = (updatedNode: WorkflowNode) => {
    const updatedNodes = nodes.map(n => n.id === updatedNode.id ? updatedNode : n);
    setNodes(updatedNodes);
    setSelectedNode(updatedNode);
  };

  const handleSave = () => {
    if (!workflowName.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    const workflowDefinition: WorkflowDefinition = {
      id: workflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      nodes,
      connections,
      enabled: workflowEnabled
    };

    onSave(workflowDefinition);
  };

  const handleTest = () => {
    // TODO: Implement workflow testing
    alert('Workflow testing will be implemented in the next iteration');
  };

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={onCancel}
            >
              Back to Recipes
            </Button>
            <Title order={2}>
              {workflow ? 'Edit Workflow' : 'Create New Workflow'}
            </Title>
          </Group>
          
          <Group>
            <Button
              variant="outline"
              leftSection={<IconPlayerPlay size={16} />}
              onClick={handleTest}
            >
              Test Workflow
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
            >
              Save Workflow
            </Button>
          </Group>
        </Group>

        {/* Workflow Settings */}
        <Card withBorder p="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Workflow Name"
                placeholder="e.g., GitHub PR Review Helper"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                required
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Description"
                placeholder="Optional description of what this workflow does"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Switch
                label="Enable this workflow"
                description="Disabled workflows won't run on matching pages"
                checked={workflowEnabled}
                onChange={(e) => setWorkflowEnabled(e.currentTarget.checked)}
              />
            </Grid.Col>
          </Grid>
        </Card>

        {/* Main Design Area */}
        <Grid>
          <Grid.Col span={8}>
            <Stack gap="md">
              <Text fw={500}>Workflow Canvas</Text>
              <WorkflowCanvas
                nodes={nodes}
                connections={connections}
                onNodesChange={setNodes}
                onConnectionsChange={setConnections}
                onNodeSelect={setSelectedNode}
                selectedNode={selectedNode}
              />
            </Stack>
          </Grid.Col>
          
          <Grid.Col span={4}>
            <Stack gap="md">
              <Text fw={500}>Node Properties</Text>
              <NodeProperties
                node={selectedNode}
                onNodeUpdate={handleNodeUpdate}
              />
              
              {/* Workflow Info */}
              <Card withBorder p="md">
                <Text fw={500} mb="xs">Workflow Info</Text>
                <Text size="sm" c="dimmed">
                  Nodes: {nodes.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Connections: {connections.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Status: {workflowEnabled ? 'Enabled' : 'Disabled'}
                </Text>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>

        {/* Help Text */}
        <Card withBorder p="md" style={{ background: '#f8f9fa' }}>
          <Text fw={500} mb="xs">How to use the Workflow Designer:</Text>
          <Text size="sm" c="dimmed">
            1. <strong>Add nodes</strong> by clicking "Add Node" and selecting from triggers, actions, or conditions<br/>
            2. <strong>Drag nodes</strong> to arrange them on the canvas<br/>
            3. <strong>Configure nodes</strong> by clicking on them and editing properties on the right<br/>
            4. <strong>Connect nodes</strong> by clicking and dragging from output points (right side) to input points (left side)<br/>
            5. <strong>Delete connections</strong> by clicking on the connection lines<br/>
            6. <strong>Test your workflow</strong> before saving to make sure it works as expected
          </Text>
          <Text size="xs" c="dimmed" mt="xs">
            💡 <strong>Connection rules:</strong> Triggers connect to Actions/Conditions, Actions connect to other Actions, 
            each input can only have one connection, and circular connections are prevented.
          </Text>
        </Card>
      </Stack>
    </Container>
  );
};