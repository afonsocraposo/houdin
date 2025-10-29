import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  Tabs,
  Text,
} from "@mantine/core";
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconDownload,
  IconHistory,
  IconVariable,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { ReactFlowCanvas } from "./ReactFlowCanvas";
import { NodeProperties } from "./NodeProperties";
import { EnvironmentVariables } from "./EnvironmentVariables";
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
import { newWorkflowId, generateId } from "@/utils/helpers";

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
      variables: workflow?.variables || {},
    },
    validate: {
      name: hasLength({ min: 2 }, "Name must be at least 2 characters long"),
      urlPattern: matches(/^https?:\/\/\S+$/, "Must be a valid URL pattern"),
    },
  });

  const { nodes, connections, set, undo, redo, current, total } =
    useWorkflowState(workflow || null);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const selectedNode = useMemo(
    () =>
      (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null) ||
      null,
    [nodes, selectedNodeId],
  );
  // Track structural changes separately from config changes
  const prevStructuralHashRef = useRef<string>('');
  const nodesWithoutConfigRef = useRef<WorkflowNode[]>([]);

  const nodesWithoutConfig = useMemo(() => {
    // Create a hash of structural properties only
    const structuralHash = nodes.map((n) => 
      `${n.id}:${n.type}:${n.position.x},${n.position.y}:${(n.inputs || []).join(',')}:${(n.outputs || []).join(',')}:${(n.data as any).type}`
    ).sort().join('|');

    // Only recalculate if structural properties have changed
    if (structuralHash !== prevStructuralHashRef.current) {
      prevStructuralHashRef.current = structuralHash;
      nodesWithoutConfigRef.current = nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        inputs: n.inputs || [],
        outputs: n.outputs || [],
        data: {
          type: (n.data as any).type, // Only include the type, not the config
          config: {}, // Empty config to avoid re-renders on config changes
        },
      }));
    }

    return nodesWithoutConfigRef.current;
  }, [nodes]);

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
      form.values.variables = workflow.variables || {};
      set(workflow.nodes || [], workflow.connections || []);
      setSelectedNodeId(null);
    } else {
      setCurrentWorkflowId(newWorkflowId());
    }
  }, [workflow]); // Removed selectedNode and nodes from dependencies

  const clearSelectedNodeErrors = useCallback(() => {
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
  }, [schemaErrors, selectedNode, setSchemaErrors]);

  const handleNodeUpdate = useCallback((updatedNode: WorkflowNode) => {
    const updatedNodes = nodesRef.current.map((n) =>
      n.id === updatedNode.id
        ? {
            ...updatedNode,
            position: n.position, // keep original position
          }
        : n,
    );
    set(updatedNodes);
    clearSelectedNodeErrors();
  }, [set, clearSelectedNodeErrors]);

  // Use refs to access current state without recreating callbacks
  const nodesRef = useRef(nodes);
  const connectionsRef = useRef(connections);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const schemaErrorsRef = useRef(schemaErrors);

  // Update refs whenever values change
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  
  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);
  
  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);
  
  useEffect(() => {
    schemaErrorsRef.current = schemaErrors;
  }, [schemaErrors]);

  const handleNodeCreation = useCallback(
    (newNode: WorkflowNode) => {
      const updatedNodes = [...nodesRef.current, newNode];
      set(updatedNodes);
      setSelectedNodeId(newNode.id);
    },
    [set],
  );

  const handleNodeMovement = useCallback(
    (id: string, position: { x: number; y: number }) => {
      const updatedNodes = nodesRef.current.map((n) =>
        n.id === id
          ? {
              ...n,
              position, // update position
            }
          : n,
      );
      set(updatedNodes, undefined);
    },
    [set],
  );

  const handleNodeDeletion = useCallback(
    (nodeId: string) => {
      const updatedNodes = nodesRef.current.filter((n) => n.id !== nodeId);
      const updatedConnections = connectionsRef.current.filter(
        (c) => c.source !== nodeId && c.target !== nodeId,
      );
      set(updatedNodes, updatedConnections);
      if (selectedNodeIdRef.current === nodeId) {
        setSelectedNodeId(null);
      }
      // remove any schema errors for the deleted node
      if (schemaErrorsRef.current[nodeId]) {
        setSchemaErrors((prev) => {
          const updated = { ...prev };
          delete updated[nodeId];
          return updated;
        });
      }
    },
    [set],
  );

  const handleConnectionCreation = useCallback(
    (newConnection: WorkflowConnection) => {
      const updatedConnections = [...connectionsRef.current, newConnection];
      set(undefined, updatedConnections);
    },
    [set],
  );

  const handleConnectionDeletion = useCallback(
    (connectionId: string) => {
      const updatedConnections = connectionsRef.current.filter(
        (c) => c.id !== connectionId,
      );
      set(undefined, updatedConnections);
    },
    [set],
  );

  const handleNodeDuplication = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      const originalNode = nodesRef.current.find((n) => n.id === nodeId);
      if (!originalNode) return;

      // Create a duplicate with a new ID and the calculated position
      const duplicatedNode: WorkflowNode = {
        ...originalNode,
        id: generateId(originalNode.type),
        position,
      };

      const updatedNodes = [...nodesRef.current, duplicatedNode];
      set(updatedNodes);
      setSelectedNodeId(duplicatedNode.id);
    },
    [set],
  );

  const handleSetNodes = useCallback(
    (newNodes: WorkflowNode[]) => {
      set(newNodes, undefined);
    },
    [set],
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

  const getCurrentWorkflowDefinition = useCallback(
    (): WorkflowDefinition => ({
      id: currentWorkflowId,
      nodes,
      connections,
      lastUpdated: Date.now(),
      ...form.getValues(),
    }),
    [nodes, connections, form.values, currentWorkflowId],
  );

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

  const variablesCount = Object.keys(form.values.variables || {}).length;

  return (
    <Container fluid pt="xl" px="0" h="100vh">
      <Stack h="100%">
        <Stack gap="lg" px="md">
          <Group justify="space-between" align="center">
            <Group>
              <Title order={2}>
                {!autoSave ? "Edit Workflow" : "Create Workflow"}
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
          <Card withBorder padding="md" pt="xs">
            <Tabs defaultValue="basic">
              <Tabs.List>
                <Tabs.Tab value="basic">
                  <Group gap="xs">
                    <IconInfoCircle size={16} />
                    <Text size="sm">Basic Info</Text>
                  </Group>
                </Tabs.Tab>
                <Tabs.Tab value="variables">
                  <Group gap="xs">
                    <IconVariable size={16} />
                    <Text size="sm">
                      Variables
                      {variablesCount > 0 ? ` (${variablesCount})` : ""}
                    </Text>
                  </Group>
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="basic" pt="md">
                <form>
                  <Grid gutter="sm">
                    <Grid.Col span={6}>
                      <TextInput
                        {...form.getInputProps("name")}
                        label="Workflow Name"
                        placeholder="Enter workflow name"
                      />
                    </Grid.Col>

                    <Grid.Col span={6}>
                      <TextInput
                        {...form.getInputProps("urlPattern")}
                        label={
                          <Group gap="0">
                            <Text size="sm">URL Pattern.</Text>
                            &nbsp;
                            <Text size="sm" c="dimmed">
                              Use * as wildcard
                            </Text>
                          </Group>
                        }
                        placeholder="https://example.com/*"
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
              </Tabs.Panel>

              <Tabs.Panel value="variables" pt="md">
                <EnvironmentVariables
                  variables={form.values.variables}
                  onChange={(variables) =>
                    form.setFieldValue("variables", variables)
                  }
                />
              </Tabs.Panel>
            </Tabs>
          </Card>{" "}
        </Stack>

        <ExportModal
          opened={exportModalOpened}
          onClose={() => setExportModalOpened(false)}
          workflow={getCurrentWorkflowDefinition()}
        />

        <Box flex={1} style={{ position: "relative", overflow: "hidden" }}>
          <ReactFlowCanvas
            nodes={nodesWithoutConfig}
            connections={connections}
            setNodes={handleSetNodes}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNodeId}
            onNodeCreate={handleNodeCreation}
            onNodeMove={handleNodeMovement}
            onNodeDelete={handleNodeDeletion}
            onNodeDuplicate={handleNodeDuplication}
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
                  nodes={nodes}
                  workflowVars={form.values.variables}
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
