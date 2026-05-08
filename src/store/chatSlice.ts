import { ChatSession } from "@/types/chat";
import { generateId } from "@/utils/helpers";
import { StateCreator } from "zustand";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface ChatSlice {
  popupSessionId: string | null;
  sessions: Record<string, ChatSession>;

  setPopupSessionId: (id: string | null) => void;
  updateSession: (
    session: Partial<ChatSession> & { workflowId: string },
  ) => void;
  clearSession: (id: string) => void;
  getSessionByWorkflowId: (workflowId: string) => ChatSession;
}

export const createChatSlice: StateCreator<ChatSlice> = (set, get) => ({
  popupSessionId: null,
  sessions: {},
  setPopupSessionId: (id) => set({ popupSessionId: id }),
  updateSession: (session: Partial<ChatSession> & { workflowId: string }) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [session.workflowId]: {
          ...state.sessions[session.workflowId],
          ...session,
          updatedAt: Date.now(),
        },
      },
    })),
  clearSession: (id) =>
    set((state) => ({
      sessions: {
        ...state.sessions,
        [id]: {
          ...state.sessions[id],
          messages: [],
          status: "ready",
          error: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    })),
  getSessionByWorkflowId: (workflowId) => {
    const session = get().sessions[workflowId];
    if (!session) {
      const session: ChatSession = {
        id: generateId("session"),
        workflowId,
        status: "ready",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set((state) => ({
        sessions: {
          ...state.sessions,
          [session.workflowId]: session,
        },
      }));
      return session;
    }
    return session;
  },
});
