import { StateCreator } from "zustand";

export interface SyncSlice {
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
}

export const createSyncSlice: StateCreator<SyncSlice> = (set) => ({
  isSyncing: false,
  setIsSyncing: (syncing: boolean) => set({ isSyncing: syncing }),
});
