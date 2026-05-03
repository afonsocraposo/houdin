import { StateCreator } from "zustand";
import { GenerationSession } from "@/types/generation-session";
import { useStore } from "@/store";

export interface GenerationSessionSlice {
  sessions: Record<string, GenerationSession>;
  activeGenerationWorkflowId: string | null;
  setActiveGenerationSession: (session: GenerationSession | null) => void;
  getActiveGenerationSession: () => GenerationSession | null;
  setActiveGenerationSessionForWorkflow: (
    workflowId: string,
    session: GenerationSession | null,
  ) => void;
  getGenerationSessionForWorkflow: (
    workflowId: string,
  ) => GenerationSession | null;
  updateActiveGenerationSession: (
    updater: (session: GenerationSession) => GenerationSession,
  ) => void;
  clearActiveGenerationSession: () => void;
  clearAllGenerationSessions: () => void;
  clearGenerationSessionForWorkflow: (workflowId: string) => void;
}

export const createGenerationSessionSlice: StateCreator<
  GenerationSessionSlice
> = (set) => ({
  sessions: {},
  activeGenerationWorkflowId: null,
  setActiveGenerationSession: (session: GenerationSession | null) =>
    set((state) => {
      if (!session) {
        return { activeGenerationWorkflowId: null };
      }

      return {
        sessions: {
          ...state.sessions,
          [session.workflowId || session.id]: session,
        },
        activeGenerationWorkflowId: session.workflowId || session.id,
      };
    }),
  getActiveGenerationSession: () => {
    const state = useStore.getState() as GenerationSessionSlice;
    const workflowId = state.activeGenerationWorkflowId;
    return workflowId ? state.sessions[workflowId] || null : null;
  },
  setActiveGenerationSessionForWorkflow: (
    workflowId: string,
    session: GenerationSession | null,
  ) =>
    set((state) => {
      if (!session) {
        const sessions = { ...state.sessions };
        delete sessions[workflowId];
        return {
          sessions,
          activeGenerationWorkflowId:
            state.activeGenerationWorkflowId === workflowId
              ? null
              : state.activeGenerationWorkflowId,
        };
      }

      return {
        sessions: { ...state.sessions, [workflowId]: session },
        activeGenerationWorkflowId: workflowId,
      };
    }),
  getGenerationSessionForWorkflow: (workflowId: string) => {
    const state = useStore.getState() as GenerationSessionSlice;
    return state.sessions[workflowId] || null;
  },
  updateActiveGenerationSession: (
    updater: (session: GenerationSession) => GenerationSession,
  ) =>
    set((state) => {
      const workflowId = state.activeGenerationWorkflowId;
      if (!workflowId) {
        return {};
      }

      const currentSession = state.sessions[workflowId];
      if (!currentSession) {
        return {};
      }

      return {
        sessions: { ...state.sessions, [workflowId]: updater(currentSession) },
      };
    }),
  clearActiveGenerationSession: () => set({ activeGenerationWorkflowId: null }),
  clearAllGenerationSessions: () => set({ sessions: {}, activeGenerationWorkflowId: null }),
  clearGenerationSessionForWorkflow: (workflowId: string) =>
    set((state) => {
      const sessions = { ...state.sessions };
      delete sessions[workflowId];
      return {
        sessions,
        activeGenerationWorkflowId:
          state.activeGenerationWorkflowId === workflowId
            ? null
            : state.activeGenerationWorkflowId,
      };
    }),
});
