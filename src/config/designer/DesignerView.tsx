import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { SESSION_STORAGE_KEY, WorkflowDesigner } from "./WorkflowDesigner";
import { WorkflowDefinition } from "@/types/workflow";
import { useStore } from "@/store";
import { newWorkflowId } from "@/utils/helpers";
import type { ConfigSearch } from "../router";
import { PlausibleEvent, trackCustomEvent } from "@/services/plausible";

function createBlankWorkflow(): WorkflowDefinition {
  return {
    id: newWorkflowId(),
    name: "",
    description: "",
    urlPattern: "https://*",
    nodes: [],
    connections: [],
    enabled: true,
    variables: {},
    modifiedAt: Date.now(),
  };
}

function DesignerView() {
  const [editingWorkflow, setEditingWorkflow] =
    useState<WorkflowDefinition | null>(null);
  const [newWorkflow, setNewWorkflow] = useState<boolean>(true);
  const navigate = useNavigate();
  const { workflowId } = useParams({ strict: false });
  const search = useSearch({ strict: false }) as ConfigSearch & { init?: string };
  const workflows = useStore((state) => state.workflows);
  const createWorkflow = useStore((state) => state.createWorkflow);
  const updateWorkflow = useStore((state) => state.updateWorkflow);

  const loadWorkflow = useCallback(
    (id: string) => {
      const workflow = workflows.find((w) => w.id === id);
      setEditingWorkflow(workflow || null);
    },
    [workflows],
  );

  // Set editing workflow based on URL parameter or example from navigation state
  useEffect(() => {
    setNewWorkflow(true);
    const init = search.init;
    if (init === "example") {
      const exampleWorkflow = sessionStorage.getItem("workflow-draft-example");
      if (exampleWorkflow) {
        setEditingWorkflow(JSON.parse(exampleWorkflow) as WorkflowDefinition);
      }
      // Clear the state to prevent re-use on subsequent navigations
    } else if (workflowId) {
      loadWorkflow(workflowId);
      setNewWorkflow(false);
    } else if (!workflowId) {
      if (init === "blank") {
        setEditingWorkflow(createBlankWorkflow());
        clearAutoSave();
      } else {
        restoreAutoSaveWorkflow();
      }
    }
  }, [workflowId, search.init]);

  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId, loadWorkflow]);

  useEffect(() => {
    const currentId = editingWorkflow?.id;
    if (!currentId) {
      return;
    }

    const storeWorkflow = workflows.find((w) => w.id === currentId);
    if (storeWorkflow && storeWorkflow !== editingWorkflow) {
      setEditingWorkflow(storeWorkflow);
    }
  }, [workflows, editingWorkflow]);

  const clearAutoSave = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const restoreAutoSaveWorkflow = () => {
    const autoSaved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (autoSaved) {
      const workflow = JSON.parse(autoSaved) as WorkflowDefinition;
      setEditingWorkflow(workflow);
    } else {
      setEditingWorkflow(createBlankWorkflow());
    }
  };

  const handleWorkflowSave = async (workflow: WorkflowDefinition) => {
    try {
      if (newWorkflow) {
        createWorkflow(workflow);
        await trackCustomEvent(PlausibleEvent.WorkflowCreated, "/designer", {
          source: search.init === "example" ? "example" : "designer",
        });
        setNewWorkflow(false);
      } else {
        updateWorkflow(workflow);
        await trackCustomEvent(PlausibleEvent.WorkflowEdited, "/designer");
      }

      setEditingWorkflow(workflow);
      clearAutoSave();
    } catch (error) {
      console.error("Failed to save workflow:", error);
    }
  };

  const handleCancel = () => {
    const currentTab = search.tab || "workflows";
    navigate({ to: "/", search: { tab: currentTab } as never });
  };

  // If a workflowId is specified, only render if we found the workflow to edit
  if (workflowId && !editingWorkflow) {
    return null;
  }

  return (
    <WorkflowDesigner
      autoSave={newWorkflow}
      workflow={editingWorkflow || undefined}
      onSave={handleWorkflowSave}
      onCancel={handleCancel}
    />
  );
}

export default DesignerView;
