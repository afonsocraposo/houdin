import { StateCreator } from "zustand";

export interface RunningSlice {
  runningWorkflows: Set<string>;
  addRunningWorkflow: (workflowId: string) => void;
  removeRunningWorkflow: (workflowId: string) => void;
}

export const createRunningSlice: StateCreator<RunningSlice> = (set) => ({
  runningWorkflows: new Set<string>(),
  addRunningWorkflow: (workflowId: string) =>
    set((state) => {
      return {
        runningWorkflows: new Set(state.runningWorkflows).add(workflowId),
      };
    }),
  removeRunningWorkflow: (workflowId: string) =>
    set((state) => {
      const newSet = new Set(state.runningWorkflows);
      newSet.delete(workflowId);
      return { runningWorkflows: newSet };
    }),
});
