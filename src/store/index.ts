import { create, Mutate, StoreApi } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { AccountSlice, createAccountSlice } from "./accountSlice";
import { WorkflowsSlice, createWorkflowsSlice } from "./workflowsSlice";
import { SyncSlice, createSyncSlice } from "./syncSlice";
import browser from "@/services/browser";

type StoreState = SyncSlice & WorkflowsSlice;
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
      ...createSyncSlice(...a),
      ...createWorkflowsSlice(...a),
    }),
    {
      name: "houdin-store",
      storage: createJSONStorage(() => browserStorageAdapter),
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
