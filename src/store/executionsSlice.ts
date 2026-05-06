import { StateCreator } from "zustand";
import {
  WorkflowExecution,
  WorkflowExecutionStats,
} from "@/types/workflow";
import { PlausibleEvent, trackCustomEvent } from "@/services/plausible";

export interface ExecutionsSlice {
  executions: WorkflowExecution[];
  executionStats: WorkflowExecutionStats;
  setExecutions: (executions: WorkflowExecution[]) => void;
  addExecution: (execution: WorkflowExecution) => void;
  clearExecutions: () => void;
}

export const createExecutionsSlice: StateCreator<ExecutionsSlice> = (set) => ({
  executions: [],
  executionStats: {
    total: 0,
    successful: 0,
    failed: 0,
  },
  setExecutions: (executions: WorkflowExecution[]) =>
    set(() => ({
      executions,
      executionStats: {
        total: executions.length,
        successful: executions.filter((execution) => execution.status === "completed").length,
        failed: executions.filter((execution) => execution.status === "failed").length,
      },
    })),
  addExecution: (execution: WorkflowExecution) =>
    set((state) => {
      if (execution.status === "completed") {
        void trackCustomEvent(PlausibleEvent.WorkflowSuccess, "/workflow-execution", {
          triggerType: execution.triggerType,
        });
      } else if (execution.status === "failed") {
        void trackCustomEvent(PlausibleEvent.WorkflowError, "/workflow-execution", {
          triggerType: execution.triggerType,
        });
      }

      const executions = [...state.executions, execution].slice(-50);

      return {
        executions,
        executionStats: {
          total: state.executionStats.total + 1,
          successful:
            state.executionStats.successful +
            (execution.status === "completed" ? 1 : 0),
          failed: state.executionStats.failed + (execution.status === "failed" ? 1 : 0),
        },
      };
    }),
  clearExecutions: () =>
    set(() => ({
      executions: [],
      executionStats: {
        total: 0,
        successful: 0,
        failed: 0,
      },
    })),
});
