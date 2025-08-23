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
import { useDebouncedCallback } from "@mantine/hooks";
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
import { ExportModal } from "./ExportModal";
import { TimeAgoText } from "./TimeAgoText";
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
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(
    null,
  );
  const [isDraft, setIsDraft] = useState(!workflow); // Track if this is a new workflow draft
  const [workflowName, setWorkflowName] = useState(workflow?.name || "");
  const [workflowDescription, setWorkflowDescription] = useState(
    workflow?.description || "",
  );
  const [workflowUrlPattern, setWorkflowUrlPattern] = useState(
    workflow?.urlPattern || "https://*",
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
          setWorkflowName(draft.name || "");
          setWorkflowDescription(draft.description || "");
          setWorkflowUrlPattern(draft.urlPattern || "https://*");
          setWorkflowEnabled(draft.enabled ?? true);
          setNodes(draft.nodes || []);
          setConnections(draft.connections || []);
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
      name: workflowName,
      description: workflowDescription,
      urlPattern: workflowUrlPattern,
      nodes,
      connections,
      enabled: workflowEnabled,
      lastUpdated: Date.now(),
    };

    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftWorkflow));
      console.debug("Saved workflow draft to session storage");
    } catch (error) {
      console.warn("Failed to save workflow draft to session storage:", error);
    }
  }, [
    isDraft,
    workflowName,
    workflowDescription,
    workflowUrlPattern,
    nodes,
    connections,
    workflowEnabled,
  ]);

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

  useEffect(markAsChanged, [
    workflowName,
    workflowDescription,
    workflowUrlPattern,
    workflowEnabled,
    nodes,
    connections,
  ]);

  // Update state when workflow prop changes (e.g., when loading from URL)
  useEffect(() => {
    if (workflow) {
      const isNewWorkflow = currentWorkflowId !== workflow.id;

      // Only update nodes if this is actually a new/different workflow
      // Don't reset nodes when just re-rendering the same workflow
      if (isNewWorkflow) {
        setCurrentWorkflowId(workflow.id || null);
        setIsDraft(false); // If we have a workflow prop, it's not a draft
        setWorkflowName(workflow.name || "");
        setWorkflowDescription(workflow.description || "");
        setWorkflowUrlPattern(workflow.urlPattern || "*://*/*");
        setWorkflowEnabled(workflow.enabled ?? true);
        setNodes(workflow.nodes || []);
        setConnections(workflow.connections || []);
        setSelectedNode(null);
      } else {
        // Same workflow - only update metadata, don't reset nodes/connections
        setWorkflowName(workflow.name || "");
        setWorkflowDescription(workflow.description || "");
        setWorkflowUrlPattern(workflow.urlPattern || "*://*/*");
        setWorkflowEnabled(workflow.enabled ?? true);

        // Try to maintain selected node by finding updated version
        if (selectedNode) {
          const updatedSelectedNode = (workflow.nodes || []).find(
            (n) => n.id === selectedNode.id,
          );
          if (updatedSelectedNode) {
            setSelectedNode(updatedSelectedNode);
          }
        }
      }
    }
  }, [workflow, currentWorkflowId]); // Removed selectedNode and nodes from dependencies

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

  console.log("Rendering WorkflowDesigner", workflow?.nodes);
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
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Workflow Name"
                    placeholder="Enter workflow name"
                    value={workflowName}
                    onChange={(e) => {
                      setWorkflowName(e.target.value);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="URL Pattern"
                    placeholder="*://example.com/* or https://github.com/*/pull/*"
                    description="Use * for wildcards. The workflow will only run on matching URLs."
                    value={workflowUrlPattern}
                    onChange={(e) => {
                      setWorkflowUrlPattern(e.target.value);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={8}>
                  <TextInput
                    label="Description (Optional)"
                    placeholder="Describe what this workflow does"
                    value={workflowDescription}
                    onChange={(e) => {
                      setWorkflowDescription(e.target.value);
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <Switch
                    label="Enabled"
                    description="Whether this workflow is active"
                    checked={workflowEnabled}
                    onChange={(e) => {
                      setWorkflowEnabled(e.target.checked);
                    }}
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
            onNodesChange={(newNodes) => {
              setNodes(newNodes);
            }}
            onConnectionsChange={(newConnections) => {
              setConnections(newConnections);
            }}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
          />
          {/* Drawer  */}
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
