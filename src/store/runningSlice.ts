import { StateCreator } from "zustand";

const RUNNING_TTL_MS = 60_000; // 1 minute

export interface RunningSlice {
  runningWorkflows: Record<string, number>;
  addRunningWorkflow: (workflowId: string) => void;
  removeRunningWorkflow: (workflowId: string) => void;
  isWorkflowRunning: (workflowId: string) => boolean;
}

export const createRunningSlice: StateCreator<RunningSlice> = (set, get) => ({
  runningWorkflows: {},
  addRunningWorkflow: (workflowId: string) =>
    set((state) => ({
      runningWorkflows: {
        ...state.runningWorkflows,
        [workflowId]: Date.now(),
      },
    })),
  removeRunningWorkflow: (workflowId: string) =>
    set((state) => {
      const { [workflowId]: _, ...rest } = state.runningWorkflows;
      return { runningWorkflows: rest };
    }),
  isWorkflowRunning: (workflowId: string) => {
    const startedAt = get().runningWorkflows[workflowId];
    if (!startedAt) return false;
    return Date.now() - startedAt < RUNNING_TTL_MS;
  },
});
