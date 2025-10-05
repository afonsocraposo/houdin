import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { ExportModal } from "@/config/workflows/ExportModal";
import {
  WorkflowNode,
  WorkflowDefinition,
  TriggerNodeData,
  ActionNodeData,
  WorkflowConnection,
} from "@/types/workflow";
import { hasLength, matches, useForm } from "@mantine/form";
import { TriggerRegistry } from "@/services/triggerRegistry";
import { ActionRegistry } from "@/services/actionRegistry";
import { useWorkflowState } from "./hooks";
import { useThrottledCallback } from "@mantine/hooks";
import { newWorkflowId } from "@/utils/helpers";

export const SESSION_STORAGE_KEY = "workflow-draft";
interface WorkflowDesignerProps {
  autoSave?: boolean;
  workflow?: WorkflowDefinition;
  onSave: (workflow: WorkflowDefinition) => void;
  onCancel: () => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  autoSave = false,
  workflow,
  onSave,
  onCancel,
}) => {
  const navigate = useNavigate();
  const readyToSave = useRef(autoSave);
  const [schemaErrors, setSchemaErrors] = useState<
    Record<string, Record<string, string[]>>
  >({});
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string>(
    workflow?.id || newWorkflowId(),
  );
  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      name: workflow?.name || "",
      description: workflow?.description || "",
      urlPattern: workflow?.urlPattern || "https://*",
      enabled: workflow?.enabled ?? true,
    },
    validate: {
      name: hasLength({ min: 2 }, "Name must be at least 2 characters long"),
      urlPattern: matches(/^https?:\/\/\S+$/, "Must be a valid URL pattern"),
    },
  });

  const { nodes, connections, set, undo, redo, current, total } =
    useWorkflowState(workflow || null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode =
    (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null) ||
    null;

  const [exportModalOpened, setExportModalOpened] = useState(false);

  // Update state when workflow prop changes (e.g., when loading from URL)
  useEffect(() => {
    if (workflow) {
      if (currentWorkflowId === workflow.id) return;

      // Only update nodes if this is actually a new/different workflow
      // Don't reset nodes when just re-rendering the same workflow
      setCurrentWorkflowId(workflow.id);
      form.values.name = workflow.name || "";
      form.values.description = workflow.description || "";
      form.values.urlPattern = workflow.urlPattern || "https://*";
      form.values.enabled = workflow.enabled ?? true;
      set(workflow.nodes || [], workflow.connections || []);
      setSelectedNodeId(null);
    } else {
      setCurrentWorkflowId(newWorkflowId());
    }
  }, [workflow]); // Removed selectedNode and nodes from dependencies

  useEffect(() => {
    // clear selected node schema errors
    if (selectedNode) {
      if (schemaErrors[selectedNode.id]) {
        setSchemaErrors((prev) => {
          const updated = { ...prev };
          delete updated[selectedNode.id];
          return updated;
        });
      }
    }
  }, [nodes]);

  const handleNodeUpdate = (updatedNode: WorkflowNode) => {
    const updatedNodes = nodes.map((n) =>
      n.id === updatedNode.id
        ? {
            ...updatedNode,
            position: n.position, // keep original position
          }
        : n,
    );
    set(updatedNodes);
  };

  const handleNodeCreation = useCallback(
    (newNode: WorkflowNode) => {
      const updatedNodes = [...nodes, newNode];
      set(updatedNodes);
      setSelectedNodeId(newNode.id);
    },
    [nodes],
  );

  const handleNodeMovement = useCallback(
    (id: string, position: { x: number; y: number }) => {
      const updatedNodes = nodes.map((n) =>
        n.id === id
          ? {
              ...n,
              position, // update position
            }
          : n,
      );
      set(updatedNodes, undefined);
    },
    [nodes],
  );

  const handleNodeDeletion = useCallback(
    (nodeId: string) => {
      const updatedNodes = nodes.filter((n) => n.id !== nodeId);
      const updatedConnections = connections.filter(
        (c) => c.source !== nodeId && c.target !== nodeId,
      );
      set(updatedNodes, updatedConnections);
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      // remove any schema errors for the deleted node
      if (schemaErrors[nodeId]) {
        setSchemaErrors((prev) => {
          const updated = { ...prev };
          delete updated[nodeId];
          return updated;
        });
      }
    },
    [nodes, connections, selectedNodeId, schemaErrors],
  );

  const handleConnectionCreation = useCallback(
    (newConnection: WorkflowConnection) => {
      const updatedConnections = [...connections, newConnection];
      set(undefined, updatedConnections);
    },
    [connections],
  );

  const handleConnectionDeletion = useCallback(
    (connectionId: string) => {
      const updatedConnections = connections.filter(
        (c) => c.id !== connectionId,
      );
      set(undefined, updatedConnections);
    },
    [connections],
  );

  const handleSave = useCallback(() => {
    readyToSave.current = false;
    const result = form.validate();
    if (result.hasErrors) {
      form.setErrors(result.errors);
      readyToSave.current = true;
      return;
    }

    const triggerRegistry = TriggerRegistry.getInstance();
    const actionRegistry = ActionRegistry.getInstance();

    // validate workflow
    const schemaErrors: Record<string, Record<string, string[]>> = {};
    nodes.forEach((node) => {
      if (node.type === "trigger") {
        const { valid, errors } = triggerRegistry.validateConfig(
          (node.data as TriggerNodeData).type,
          node.data.config,
        );
        if (!valid) {
          schemaErrors[node.id] = errors;
        }
      } else if (node.type === "action") {
        const { valid, errors } = actionRegistry.validateConfig(
          (node.data as ActionNodeData).type,
          node.data.config,
        );
        if (!valid) {
          schemaErrors[node.id] = errors;
        }
      }
    });
    if (Object.keys(schemaErrors).length > 0) {
      setSchemaErrors(schemaErrors);
      readyToSave.current = true;
      return;
    }

    const workflowDefinition = getCurrentWorkflowDefinition();

    onSave(workflowDefinition);
  }, [nodes, connections, form]);

  const handleExport = () => {
    setExportModalOpened(true);
  };

  const handleViewHistory = () => {
    if (workflow?.id) {
      navigate(`/?tab=history&workflow=${workflow.id}`);
    }
  };

  const getCurrentWorkflowDefinition = (): WorkflowDefinition => {
    return {
      id: currentWorkflowId,
      nodes,
      connections,
      lastUpdated: Date.now(),
      ...form.getValues(),
    };
  };

  const handleAutoSave = useThrottledCallback(
    useCallback(() => {
      if (!readyToSave.current) return;
      if (autoSave && nodes.length > 0) {
        const draft = getCurrentWorkflowDefinition();
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(draft));
      }
    }, [getCurrentWorkflowDefinition, autoSave]),
    1000,
  );

  useEffect(() => {
    handleAutoSave();
  }, [nodes, connections, form.values, handleAutoSave]);

  return (
    <Container fluid pt="xl" px="0" h="100vh">
      <Stack h="100%">
        <Stack gap="lg" px="md">
          <Group justify="space-between" align="center">
            <Group>
              <Title order={2}>
                {workflow ? "Edit Workflow" : "Create New Workflow"}
              </Title>
            </Group>
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
                Save & Apply Workflow
              </Button>
            </Group>
          </Group>

          <Card withBorder padding="lg">
            <form>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    mt="lg"
                    {...form.getInputProps("name")}
                    label="Workflow Name"
                    placeholder="Enter workflow name"
                  />
                </Grid.Col>

                <Grid.Col span={6}>
                  <TextInput
                    {...form.getInputProps("urlPattern")}
                    label="URL Pattern"
                    placeholder="https://afonsoraposo.com/*"
                    description="Use * for wildcards. The workflow will only run on matching URLs."
                  />
                </Grid.Col>

                <Grid.Col span={8}>
                  <TextInput
                    {...form.getInputProps("description")}
                    label="Description (Optional)"
                    placeholder="Describe what this workflow does"
                  />
                </Grid.Col>

                <Grid.Col span={4}>
                  <Switch
                    {...form.getInputProps("enabled", { type: "checkbox" })}
                    label={form.values.enabled ? "Active" : "Inactive"}
                    mt="xl"
                  />
                </Grid.Col>
              </Grid>
            </form>
          </Card>
        </Stack>

        <ExportModal
          opened={exportModalOpened}
          onClose={() => setExportModalOpened(false)}
          workflow={getCurrentWorkflowDefinition()}
        />

        <Box flex={1} style={{ position: "relative" }}>
          <ReactFlowCanvas
            nodes={nodes}
            connections={connections}
            setNodes={(n: WorkflowNode[]) => set(n, undefined)}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNodeId}
            onNodeCreate={handleNodeCreation}
            onNodeMove={handleNodeMovement}
            onNodeDelete={handleNodeDeletion}
            onConnectionCreate={handleConnectionCreation}
            onConnectionDelete={handleConnectionDeletion}
            errors={schemaErrors}
            undo={undo}
            redo={redo}
            hasPrevious={current > 0}
            hasNext={current < total - 1}
          />
          {/* Drawer  */}
          <Transition
            mounted={selectedNodeId !== null}
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
                  onClose={() => setSelectedNodeId(null)}
                  onNodeUpdate={handleNodeUpdate}
                  errors={schemaErrors[selectedNode?.id || ""]}
                />
              </Paper>
            )}
          </Transition>
        </Box>
      </Stack>
    </Container>
  );
};
