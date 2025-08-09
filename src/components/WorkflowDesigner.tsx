import React, { useState, useEffect } from "react";
import {
  Container,
  Title,
  Grid,
  Stack,
  Button,
  Group,
  TextInput,
  Switch,
  Card,
  Box,
  Transition,
  Paper,
} from "@mantine/core";
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconDownload,
  IconHistory,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { ReactFlowCanvas } from "./ReactFlowCanvas";
import { NodeProperties } from "./NodeProperties";
import { ExportModal } from "./ExportModal";
import {
  WorkflowNode,
  WorkflowConnection,
  WorkflowDefinition,
} from "../types/workflow";

interface WorkflowDesignerProps {
  workflow?: WorkflowDefinition;
  onSave: (workflow: WorkflowDefinition) => void;
  onCancel: () => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  workflow,
  onSave,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [workflowName, setWorkflowName] = useState(workflow?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(
    workflow?.description || "",
  );
  const [workflowUrlPattern, setWorkflowUrlPattern] = useState(
    workflow?.urlPattern || "https://*/*",
  );
  const [workflowEnabled, setWorkflowEnabled] = useState(
    workflow?.enabled ?? true,
  );
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow?.nodes || []);
  const [connections, setConnections] = useState<WorkflowConnection[]>(
    workflow?.connections || [],
  );
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [exportModalOpened, setExportModalOpened] = useState(false);

  // Update state when workflow prop changes (e.g., when loading from URL)
  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name || "");
      setWorkflowDescription(workflow.description || "");
      setWorkflowUrlPattern(workflow.urlPattern || "*://*/*");
      setWorkflowEnabled(workflow.enabled ?? true);
      setNodes(workflow.nodes || []);
      setConnections(workflow.connections || []);
      setSelectedNode(null); // Reset selected node when workflow changes
    }
  }, [workflow]);

  const handleNodeUpdate = (updatedNode: WorkflowNode) => {
    const updatedNodes = nodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n,
    );
    setNodes(updatedNodes);
    setSelectedNode(updatedNode);
  };

  const handleSave = () => {
    if (!workflowName.trim()) {
      alert("Please enter a workflow name");
      return;
    }

    if (!workflowUrlPattern.trim()) {
      alert("Please enter a URL pattern");
      return;
    }

    const workflowDefinition: WorkflowDefinition = {
      id: workflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      urlPattern: workflowUrlPattern,
      nodes,
      connections,
      enabled: workflowEnabled,
      lastUpdated: Date.now(),
    };

    onSave(workflowDefinition);
  };

  const handleExport = () => {
    setExportModalOpened(true);
  };

  const handleViewHistory = () => {
    if (workflow?.id) {
      navigate(`/executions/${workflow.id}`);
    }
  };

  const getCurrentWorkflowDefinition = (): WorkflowDefinition => {
    return {
      id: workflow?.id || `workflow-${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      urlPattern: workflowUrlPattern,
      nodes,
      connections,
      enabled: workflowEnabled,
      lastUpdated: Date.now(),
    };
  };

  return (
    <Container fluid pt="xl" px="0" h="100vh">
      <Stack h="100%">
        <Stack gap="lg" px="md">
          <Group justify="space-between" align="center">
            <Title order={2}>
              {workflow ? "Edit Workflow" : "Create New Workflow"}
            </Title>
            <Group>
              <Button
                variant="outline"
                leftSection={<IconArrowLeft size={16} />}
                onClick={onCancel}
              >
                Back to Workflows
              </Button>
              {workflow && (
                <Button
                  variant="outline"
                  leftSection={<IconHistory size={16} />}
                  onClick={handleViewHistory}
                >
                  View History
                </Button>
              )}
              <Button
                variant="outline"
                leftSection={<IconDownload size={16} />}
                onClick={handleExport}
              >
                Export
              </Button>
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSave}
              >
                Save Workflow
              </Button>
            </Group>
          </Group>

          <Card withBorder padding="lg">
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Workflow Name"
                    placeholder="Enter workflow name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="URL Pattern"
                    placeholder="*://example.com/* or https://github.com/*/pull/*"
                    description="Use * for wildcards. The workflow will only run on matching URLs."
                    value={workflowUrlPattern}
                    onChange={(e) => setWorkflowUrlPattern(e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={8}>
                  <TextInput
                    label="Description (Optional)"
                    placeholder="Describe what this workflow does"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Switch
                    label="Enabled"
                    description="Whether this workflow is active"
                    checked={workflowEnabled}
                    onChange={(e) => setWorkflowEnabled(e.target.checked)}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Card>
        </Stack>

        {workflowName.trim() && (
          <ExportModal
            opened={exportModalOpened}
            onClose={() => setExportModalOpened(false)}
            workflow={getCurrentWorkflowDefinition()}
          />
        )}

        <Box flex={1} style={{ position: "relative" }}>
          <ReactFlowCanvas
            nodes={nodes}
            connections={connections}
            onNodesChange={setNodes}
            onConnectionsChange={setConnections}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
          />
          <Transition
            mounted={selectedNode !== null}
            transition="slide-left"
            duration={200}
            timingFunction="ease"
          >
            {(styles) => (
              <Paper
                shadow="md"
                p="md"
                h="100%"
                style={{
                  ...styles,
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: 400,
                  zIndex: 1,
                }}
              >
                <NodeProperties
                  node={selectedNode}
                  onNodeUpdate={handleNodeUpdate}
                />
              </Paper>
            )}
          </Transition>
        </Box>
      </Stack>
    </Container>
  );
};
