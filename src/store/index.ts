import { create, Mutate, StoreApi } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { AccountSlice, createAccountSlice } from "./accountSlice";
import { WorkflowsSlice, createWorkflowsSlice } from "./workflowsSlice";
import browser from "@/services/browser";
import { createCredentialsSlice, CredentialsSlice } from "./credentialsSlice";
import {
  createGenerationSessionSlice,
  GenerationSessionSlice,
} from "./generationSessionSlice";
import { createExecutionsSlice, ExecutionsSlice } from "./executionsSlice";
import { createSyncSlice, SyncSlice } from "./syncSlice";

type StoreState = WorkflowsSlice & CredentialsSlice & GenerationSessionSlice & ExecutionsSlice & SyncSlice;
type SessionStoreState = AccountSlice;

const browserStorageAdapter: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const result = await browser.storage.local.get([name]);
    return result[name] || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await browser.storage.local.set({ [name]: value });
  },
  removeItem: async (name: string): Promise<void> => {
    await browser.storage.local.remove([name]);
  },
};

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createWorkflowsSlice(...a),
      ...createCredentialsSlice(...a),
      ...createGenerationSessionSlice(...a),
      ...createExecutionsSlice(...a),
      ...createSyncSlice(...a),
    }),
    {
      name: "houdin-store",
      storage: createJSONStorage(() => browserStorageAdapter),
      partialize: (state) => ({
        ...state,
        pendingUpdates: Array.from(state.pendingUpdates),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as any;
        return {
          ...currentState,
          ...persisted,
          pendingUpdates: new Set(persisted.pendingUpdates || []),
        };
      },
    },
  ),
);
export const useSessionStore = create<SessionStoreState>()(
  persist(
    (...a) => ({
      ...createAccountSlice(...a),
    }),
    {
      name: "houdin-session-store",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

type StoreWithPersist = Mutate<
  StoreApi<StoreState>,
  [["zustand/persist", unknown]]
>;

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes["houdin-store"]) {
    (useStore as StoreWithPersist).persist.rehydrate();
  }
});
