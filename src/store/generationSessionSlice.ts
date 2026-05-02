import { StateCreator } from "zustand";
import { GenerationSession } from "@/types/generation-session";

export interface GenerationSessionSlice {
  activeGenerationSession: GenerationSession | null;
  setActiveGenerationSession: (session: GenerationSession | null) => void;
  updateActiveGenerationSession: (
    updater: (session: GenerationSession) => GenerationSession,
  ) => void;
  clearActiveGenerationSession: () => void;
}

export const createGenerationSessionSlice: StateCreator<GenerationSessionSlice> =
  (set) => ({
    activeGenerationSession: null,
    setActiveGenerationSession: (session: GenerationSession | null) =>
      set({ activeGenerationSession: session }),
    updateActiveGenerationSession: (
      updater: (session: GenerationSession) => GenerationSession,
    ) =>
      set((state) => {
        if (!state.activeGenerationSession) {
          return {};
        }

        return {
          activeGenerationSession: updater(state.activeGenerationSession),
        };
      }),
    clearActiveGenerationSession: () => set({ activeGenerationSession: null }),
  });
