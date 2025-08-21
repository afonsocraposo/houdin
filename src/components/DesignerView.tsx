import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { WorkflowDesigner } from "./WorkflowDesigner";
import { ContentStorageClient } from "../services/storage";
import { WorkflowDefinition } from "../types/workflow";

interface DesignerViewProps {
  workflowId?: string;
}

function DesignerView({ workflowId }: DesignerViewProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [editingWorkflow, setEditingWorkflow] =
    useState<WorkflowDefinition | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const storageClient = new ContentStorageClient();

  useEffect(() => {
    // Load existing workflows from storage
    const loadData = async () => {
      try {
        const loadedWorkflows = await storageClient.getWorkflows();
        setWorkflows(loadedWorkflows);
      } catch (error) {
        console.error("Failed to load workflows:", error);
      }
    };

    loadData();
  }, []);

  // Set editing workflow based on URL parameter
  useEffect(() => {
    if (workflowId && workflows.length > 0) {
      const workflow = workflows.find((w) => w.id === workflowId);
      setEditingWorkflow(workflow || null);
    } else if (!workflowId) {
      setEditingWorkflow(null);
    }
  }, [workflowId, workflows]);

  const handleWorkflowSave = async (workflow: WorkflowDefinition) => {
    try {
      const updatedWorkflows = editingWorkflow
        ? workflows.map((w) => (w.id === workflow.id ? workflow : w))
        : [...workflows, workflow];

      await storageClient.saveWorkflows(updatedWorkflows);
      setWorkflows(updatedWorkflows);

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

  return (
    <WorkflowDesigner
      workflow={editingWorkflow || undefined}
      onSave={handleWorkflowSave}
      onCancel={handleCancel}
    />
  );
}

export default DesignerView;
