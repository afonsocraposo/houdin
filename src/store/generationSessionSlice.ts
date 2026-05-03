import { StateCreator } from "zustand";
import { GenerationSession } from "@/types/generation-session";

export interface GenerationSessionSlice {
  sessions: Record<string, GenerationSession>;
  activeGenerationSession: string | null;
  setActiveGenerationSession: (session: GenerationSession | null) => void;
  updateActiveGenerationSession: (
    updater: (session: GenerationSession) => GenerationSession,
  ) => void;
  clearActiveGenerationSession: () => void;
}

export const createGenerationSessionSlice: StateCreator<
  GenerationSessionSlice
> = (set) => ({
  sessions: {},
  activeGenerationSession: null,
  setActiveGenerationSession: (session: GenerationSession | null) =>
    set((state) => {
      const sessions = { ...state.sessions };
      if (Object.keys(sessions).length > 10) {
        // Limit to 10 sessions, remove the oldest one
        let oldestSessionId = null;
        let oldestTimestamp = Infinity;
        for (const [id, session] of Object.entries(sessions)) {
          if (session.createdAt < oldestTimestamp) {
            oldestTimestamp = session.createdAt;
            oldestSessionId = id;
          }
        }
        delete sessions[oldestSessionId!];
      }
      return { activeGenerationSession: session?.id };
    }),
  updateActiveGenerationSession: (
    updater: (session: GenerationSession) => GenerationSession,
  ) =>
    set((state) => {
      if (!state.activeGenerationSession) {
        return {};
      }

      return {
        activeGenerationSession: updater(
          state.sessions[state.activeGenerationSession],
        ).id,
      };
    }),
  clearActiveGenerationSession: () => set({ activeGenerationSession: null }),
});
