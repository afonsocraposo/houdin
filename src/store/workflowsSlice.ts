import { StateCreator } from "zustand";
import { WorkflowDefinition } from "@/types/workflow";

export interface WorkflowsSlice {
  workflows: WorkflowDefinition[];
  setWorkflows: (workflows: WorkflowDefinition[]) => void;
  createWorkflow: (workflow: WorkflowDefinition) => void;
  updateWorkflow: (workflow: WorkflowDefinition) => void;
  deleteWorkflow: (workflowId: string) => void;
  applyServerUpdate: (workflow: WorkflowDefinition) => void;
  applyServerDelete: (workflowId: string) => void;
  lastServerTime: number;
  setLastServerTime: (timestamp: number) => void;
  pendingUpdates: Set<string>;
  clearPendingUpdates: () => void;
  pendingDeletes: Record<string, number>;
  clearPendingDeletes: () => void;
}

export const createWorkflowsSlice: StateCreator<WorkflowsSlice> = (set) => ({
  workflows: [],
  setWorkflows: (workflows: WorkflowDefinition[]) => set({ workflows }),
  createWorkflow: (workflow: WorkflowDefinition) =>
    set((state) => {
      const newSet = new Set(state.pendingUpdates);
      newSet.add(workflow.id);
      return {
        workflows: [...state.workflows, workflow],
        pendingUpdates: newSet,
      };
    }),
  updateWorkflow: (updatedWorkflow: WorkflowDefinition) =>
    set((state) => {
      const newSet = new Set(state.pendingUpdates);
      newSet.add(updatedWorkflow.id);
      const index = state.workflows.findIndex(
        (w) => w.id === updatedWorkflow.id,
      );
      const newWorkflows = [...state.workflows];
      if (index !== -1) {
        newWorkflows[index] = updatedWorkflow;
      } else {
        newWorkflows.push(updatedWorkflow);
      }
      return {
        workflows: newWorkflows,
        pendingUpdates: newSet,
      };
    }),
  deleteWorkflow: (workflowId: string) =>
    set((state) => {
      const newPendingDeletes = { ...state.pendingDeletes };
      newPendingDeletes[workflowId] = Date.now();
      return {
        workflows: state.workflows.filter((w) => w.id !== workflowId),
        pendingDeletes: newPendingDeletes,
      };
    }),
  applyServerUpdate: (updatedWorkflow: WorkflowDefinition) =>
    set((state) => {
      const index = state.workflows.findIndex(
        (w) => w.id === updatedWorkflow.id,
      );
      const newWorkflows = [...state.workflows];
      if (index !== -1) {
        newWorkflows[index] = updatedWorkflow;
      } else {
        newWorkflows.push(updatedWorkflow);
      }
      return {
        workflows: newWorkflows,
      };
    }),
  applyServerDelete: (workflowId: string) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== workflowId),
    })),
  lastServerTime: 0,
  setLastServerTime: (timestamp: number) =>
    set(() => ({
      lastServerTime: timestamp,
    })),
  pendingUpdates: new Set<string>(),
  clearPendingUpdates: () => set(() => ({ pendingUpdates: new Set<string>() })),
  pendingDeletes: {},
  clearPendingDeletes: () => set(() => ({ pendingDeletes: {} })),
});
