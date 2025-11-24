import { StateCreator } from "zustand";
import { WorkflowDefinition } from "@/types/workflow";
import { OutboxAction, WorkflowOutboxMessage } from "@/types/outbox";

export interface WorkflowsSlice {
  workflows: WorkflowDefinition[];
  setWorkflows: (workflows: WorkflowDefinition[]) => void;
  createWorkflow: (workflow: WorkflowDefinition) => void;
  updateWorkflow: (workflow: WorkflowDefinition) => void;
  deleteWorkflow: (workflowId: string) => void;
  outbox: WorkflowOutboxMessage[];
  pop: () => void;
}

const pushToOutbox = (
  state: WorkflowsSlice,
  workflowId: string,
  action: OutboxAction,
  workflow?: WorkflowDefinition,
): WorkflowOutboxMessage[] => {
  if (action === "delete") {
    return [
      ...state.outbox,
      {
        workflowId,
        action,
        timestamp: Date.now(),
      },
    ];
  } else {
    return [
      ...state.outbox,
      {
        workflowId,
        action,
        timestamp: Date.now(),
        workflow: workflow!,
      },
    ];
  }
};

export const createWorkflowsSlice: StateCreator<WorkflowsSlice> = (set) => ({
  workflows: [],
  setWorkflows: (workflows: WorkflowDefinition[]) => set({ workflows }),
  createWorkflow: (workflow: WorkflowDefinition) =>
    set((state) => ({
      workflows: [...state.workflows, workflow],
      outbox: pushToOutbox(state, workflow.id, "create", workflow),
    })),
  updateWorkflow: (updatedWorkflow: WorkflowDefinition) =>
    set((state) => ({
      workflows: state.workflows.map((workflow) =>
        workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow,
      ),
      outbox: pushToOutbox(
        state,
        updatedWorkflow.id,
        "update",
        updatedWorkflow,
      ),
    })),
  deleteWorkflow: (workflowId: string) =>
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== workflowId),
      outbox: pushToOutbox(state, workflowId, "delete"),
    })),
  outbox: [],
  pop: () =>
    set((state) => ({
      outbox: state.outbox.slice(1),
    })),
});
