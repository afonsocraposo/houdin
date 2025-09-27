import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { SESSION_STORAGE_KEY, WorkflowDesigner } from "./WorkflowDesigner";
import { ContentStorageClient } from "@/services/storage";
import { WorkflowDefinition } from "@/types/workflow";

interface DesignerViewProps {
  workflowId?: string;
}

function DesignerView({ workflowId }: DesignerViewProps) {
  const [editingWorkflow, setEditingWorkflow] =
    useState<WorkflowDefinition | null>(null);
  const [newWorkflow, setNewWorkflow] = useState<boolean>(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const storageClient = new ContentStorageClient();

  const loadWorkflow = useCallback(async (id: string) => {
    const workflows = await storageClient.getWorkflows();
    const workflow = workflows.find((w) => w.id === id);
    setEditingWorkflow(workflow || null);
  }, []);

  // Set editing workflow based on URL parameter or example from navigation state
  useEffect(() => {
    // Check if we have an example workflow from navigation state
    const exampleWorkflow = location.state?.exampleWorkflow as
      | WorkflowDefinition
      | undefined;

    setNewWorkflow(true);
    if (exampleWorkflow) {
      setEditingWorkflow(exampleWorkflow);
      // Clear the state to prevent re-use on subsequent navigations
      window.history.replaceState({}, "");
    } else if (workflowId) {
      loadWorkflow(workflowId);
      setNewWorkflow(false);
    } else if (!workflowId) {
      restoreAutoSaveWorkflow();
    }
  }, [workflowId, location.state]);

  const restoreAutoSaveWorkflow = () => {
    const autoSaved = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (autoSaved) {
      const workflow = JSON.parse(autoSaved) as WorkflowDefinition;
      setEditingWorkflow(workflow);
    } else {
      setEditingWorkflow(null);
    }
  };

  const handleWorkflowSave = async (workflow: WorkflowDefinition) => {
    try {
      if (newWorkflow) {
        await storageClient.createWorkflow(workflow);
      } else {
        await storageClient.updateWorkflow(workflow);
      }

      // Sync HTTP triggers in background script when explicitly saving
      const runtime = (
        typeof browser !== "undefined" ? browser : chrome
      ) as any;
      runtime.runtime.sendMessage({ type: "SYNC_HTTP_TRIGGERS" });

      // Navigate back to workflows list, preserving the current tab
      const currentTab = searchParams.get("tab") || "workflows";
      navigate(`/?tab=${currentTab}`);
      setEditingWorkflow(null);
    } catch (error) {
      console.error("Failed to save workflow:", error);
    }
  };

  const handleCancel = () => {
    const currentTab = searchParams.get("tab") || "workflows";
    navigate(`/?tab=${currentTab}`);
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
