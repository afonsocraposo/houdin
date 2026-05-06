import { StateCreator } from "zustand";
import { GenerationSession } from "@/types/generation-session";
import { useStore } from "@/store";
import { newWorkflowId } from "@/utils/helpers";

export interface GenerationSessionSlice {
  sessions: Record<string, GenerationSession>;
  popupActiveWorkflowId: string;
  setPopupActiveWorkflowId: (workflowId: string) => void;
  getGenerationSessionForWorkflow: (
    workflowId: string,
  ) => GenerationSession | null;
  setSessionForWorkflow: (
    workflowId: string,
    session: GenerationSession | null,
  ) => void;
  updateSessionForWorkflow: (
    workflowId: string,
    updater: (session: GenerationSession) => GenerationSession,
  ) => void;
  clearAllGenerationSessions: () => void;
  clearGenerationSessionForWorkflow: (workflowId: string) => void;
}

export const createGenerationSessionSlice: StateCreator<
  GenerationSessionSlice
> = (set) => ({
  sessions: {},
  popupActiveWorkflowId: newWorkflowId(),
  setPopupActiveWorkflowId: (workflowId: string) =>
    set({ popupActiveWorkflowId: workflowId }),
  getGenerationSessionForWorkflow: (workflowId: string) => {
    const state = useStore.getState() as GenerationSessionSlice;
    return state.sessions[workflowId] || null;
  },
  setSessionForWorkflow: (workflowId, session) =>
    set((state) => {
      if (!session) {
        const sessions = { ...state.sessions };
        delete sessions[workflowId];
        return { sessions };
      }
      return {
        sessions: { ...state.sessions, [workflowId]: session },
      };
    }),
  updateSessionForWorkflow: (workflowId, updater) =>
    set((state) => {
      const current = state.sessions[workflowId];
      if (!current) return {};
      return {
        sessions: { ...state.sessions, [workflowId]: updater(current) },
      };
    }),
  clearAllGenerationSessions: () => set({ sessions: {} }),
  clearGenerationSessionForWorkflow: (workflowId: string) =>
    set((state) => {
      const sessions = { ...state.sessions };
      delete sessions[workflowId];
      return { sessions };
    }),
});
