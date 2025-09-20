import React, { useState, useEffect, useCallback } from "react";
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
  Text,
  Loader,
} from "@mantine/core";
import { useDebouncedCallback, useThrottledCallback } from "@mantine/hooks";
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconDownload,
  IconHistory,
  IconCheck,
  IconExclamationMark,
} from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { ReactFlowCanvas } from "./ReactFlowCanvas";
import { NodeProperties } from "./NodeProperties";
import { ExportModal } from "@/config/workflows/ExportModal";
import { TimeAgoText } from "@/components/TimeAgoText";
import {
  WorkflowNode,
  WorkflowDefinition,
  TriggerNodeData,
  ActionNodeData,
} from "@/types/workflow";
import { hasLength, matches, useForm } from "@mantine/form";
import { TriggerRegistry } from "@/services/triggerRegistry";
import { ActionRegistry } from "@/services/actionRegistry";
import { useWorkflowState } from "./hooks";

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
  const [schemaErrors, setSchemaErrors] = useState<
    Record<string, Record<string, string[]>>
  >({});
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(
    null,
  );
  const [isDraft, setIsDraft] = useState(!workflow); // Track if this is a new workflow draft
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
  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null;

  const [exportModalOpened, setExportModalOpened] = useState(false);

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number | null>(null);

  // Draft storage key
  const DRAFT_STORAGE_KEY = "workflow-draft";

  // Load draft from session storage if no workflow is provided
  useEffect(() => {
    if (!workflow) {
      const storedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (storedDraft) {
        try {
          const draft = JSON.parse(storedDraft);
          if (draft.name) {
            form.values.name = draft.name;
          }
          if (draft.description) {
            form.values.description = draft.description;
          }
          if (draft.urlPattern) {
            form.values.urlPattern = draft.urlPattern;
          }
          if (typeof draft.enabled === "boolean") {
            form.values.enabled = draft.enabled;
          }
          set(draft.nodes || [], draft.connections || []);
          console.debug("Loaded workflow draft from session storage");
        } catch (error) {
          console.warn(
            "Failed to load workflow draft from session storage:",
            error,
          );
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    }
  }, [workflow]);

  // Save draft to session storage
  const saveDraft = useCallback(() => {
    if (!isDraft) return; // Only save drafts for new workflows

    const draftWorkflow = {
      name: form.values.name,
      description: form.values.description,
      urlPattern: form.values.urlPattern,
      nodes,
      connections,
      enabled: form.values.enabled,
      lastUpdated: Date.now(),
    };

    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftWorkflow));
      console.debug("Saved workflow draft to session storage");
    } catch (error) {
      console.warn("Failed to save workflow draft to session storage:", error);
    }
  }, [isDraft, form.values, nodes, connections]);

  // Clear draft from session storage
  const clearDraft = useCallback(() => {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    console.debug("Cleared workflow draft from session storage");
  }, []);

  // Track changes to mark as unsaved
  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
    setAutoSaveStatus("idle");
  }, []);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    // Only auto-save for new workflows (drafts), not existing workflows
    if (!isDraft) {
      return;
    }

    // For new workflows (drafts), save to session storage
    saveDraft();
    setAutoSaveStatus("saved");
    setHasUnsavedChanges(false);
    setLastAutoSaveTime(Date.now());

    // Reset to idle after 2 seconds
    setTimeout(() => setAutoSaveStatus("idle"), 2000);
  }, [isDraft, saveDraft]);

  // Debounced auto-save function
  const debouncedAutoSave = useDebouncedCallback(() => {
    // Only auto-save for new workflows (drafts)
    if (!hasUnsavedChanges) {
      return;
    }
    performAutoSave();
  }, 3000);

  // Trigger auto-save when changes occur (only for new workflows)
  useEffect(() => {
    if (isDraft && hasUnsavedChanges) {
      debouncedAutoSave();
    }
  }, [hasUnsavedChanges, debouncedAutoSave, isDraft]);

  useEffect(markAsChanged, [form.values, { nodes, connections }]);

  // Update state when workflow prop changes (e.g., when loading from URL)
  useEffect(() => {
    if (workflow) {
      if (currentWorkflowId !== workflow.id) return;

      // Only update nodes if this is actually a new/different workflow
      // Don't reset nodes when just re-rendering the same workflow
      setCurrentWorkflowId(workflow.id || null);
      setIsDraft(false); // If we have a workflow prop, it's not a draft
      form.values.name = workflow.name || "";
      form.values.description = workflow.description || "";
      form.values.urlPattern = workflow.urlPattern || "https://*";
      form.values.enabled = workflow.enabled ?? true;
      set(workflow.nodes || [], workflow.connections || []);
      setSelectedNodeId(null);
    }
  }, [workflow, currentWorkflowId]); // Removed selectedNode and nodes from dependencies

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

  const handleSave = () => {
    const result = form.validate();
    if (result.hasErrors) {
      form.setErrors(result.errors);
      return;
    }

    const triggerRegistry = TriggerRegistry.getInstance();
    const actionRegistry = ActionRegistry.getInstance();

    // validate workflow
    const schemaErrors: Record<string, Record<string, string[]>> = {};
    nodes.forEach((node) => {
      if (node.type === "trigger") {
        const { valid, errors } = triggerRegistry.validateConfig(
          (node.data as TriggerNodeData).triggerType,
          node.data.config,
        );
        if (!valid) {
          schemaErrors[node.id] = errors;
        }
      } else if (node.type === "action") {
        const { valid, errors } = actionRegistry.validateConfig(
          (node.data as ActionNodeData).actionType,
          node.data.config,
        );
        if (!valid) {
          schemaErrors[node.id] = errors;
        }
      }
    });
    if (Object.keys(schemaErrors).length > 0) {
      setSchemaErrors(schemaErrors);
      return;
    }

    const workflowDefinition = getCurrentWorkflowDefinition();

    onSave(workflowDefinition);
    setHasUnsavedChanges(false);
    setAutoSaveStatus("idle");
    setLastAutoSaveTime(Date.now());

    // If this was a draft, clear it and mark as no longer a draft
    if (isDraft) {
      clearDraft();
      setIsDraft(false);
      setCurrentWorkflowId(workflowDefinition.id);
    }
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
      id: workflow?.id || "draft-workflow",
      nodes,
      connections,
      lastUpdated: Date.now(),
      ...form.getValues(),
    };
  };

  return (
    <Container fluid pt="xl" px="0" h="100vh">
      <Stack h="100%">
        <Stack gap="lg" px="md">
          <Group justify="space-between" align="center">
            <Group>
              <Title order={2}>
                {workflow ? "Edit Workflow" : "Create New Workflow"}
              </Title>
              {/* Auto-save status indicator */}
              {autoSaveStatus === "saving" && (
                <Group gap="xs">
                  <Loader size="xs" />
                  <Text size="sm" c="dimmed">
                    {isDraft ? "Saving draft..." : "Saving..."}
                  </Text>
                </Group>
              )}
              {autoSaveStatus === "saved" && (
                <Group gap="xs">
                  <IconCheck size={16} color="green" />
                  <Text size="sm" c="green">
                    {isDraft ? "Draft saved" : "Saved"}
                  </Text>
                </Group>
              )}
              {autoSaveStatus === "error" && (
                <Group gap="xs">
                  <IconExclamationMark size={16} color="red" />
                  <Text size="sm" c="red">
                    {isDraft ? "Draft save failed" : "Save failed"}
                  </Text>
                </Group>
              )}
              {autoSaveStatus === "idle" && lastAutoSaveTime && (
                <TimeAgoText
                  timestamp={lastAutoSaveTime}
                  prefix={isDraft ? "Draft saved" : "Auto-saved"}
                  size="sm"
                  c="dimmed"
                />
              )}
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
            onStateChange={set}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNodeId}
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
