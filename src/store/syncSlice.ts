import { StateCreator } from "zustand";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncResult {
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface SyncSlice {
  isSyncing: boolean;
  lastSynced: number | null;
  status: SyncStatus;
  syncResult: SyncResult | null;
  setIsSyncing: (syncing: boolean) => void;
  setLastSynced: (timestamp: number | null) => void;
  setStatus: (status: SyncStatus) => void;
  setSyncResult: (result: SyncResult | null) => void;
}

export const createSyncSlice: StateCreator<SyncSlice> = (set) => ({
  isSyncing: false,
  lastSynced: null,
  status: "idle",
  syncResult: null,
  setIsSyncing: (syncing: boolean) => set({ isSyncing: syncing }),
  setLastSynced: (timestamp: number | null) => set({ lastSynced: timestamp }),
  setStatus: (status: SyncStatus) => set({ status }),
  setSyncResult: (result: SyncResult | null) => set({ syncResult: result }),
});
