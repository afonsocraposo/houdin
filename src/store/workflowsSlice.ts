import { StateCreator } from "zustand";
import { WorkflowDefinition } from "@/types/workflow";

export interface WorkflowsSlice {
  workflows: WorkflowDefinition[];
  setWorkflows: (workflows: WorkflowDefinition[]) => void;
  createWorkflow: (workflow: WorkflowDefinition) => void;
  updateWorkflow: (workflow: WorkflowDefinition) => void;
  deleteWorkflow: (workflowId: string) => void;
}

export const createWorkflowsSlice: StateCreator<WorkflowsSlice> = (set) => ({
  workflows: [],
  setWorkflows: (workflows: WorkflowDefinition[]) => set({ workflows }),
  createWorkflow: (workflow: WorkflowDefinition) =>
    set((state) => ({
      workflows: [...state.workflows, workflow],
    })),
  updateWorkflow: (updatedWorkflow: WorkflowDefinition) =>
    set((state) => ({
      workflows: state.workflows.map((workflow) =>
        workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow,
      ),
    })),
  deleteWorkflow: (workflowId: string) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== workflowId),
    })),
});
