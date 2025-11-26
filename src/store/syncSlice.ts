import { StateCreator } from "zustand";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncResult {
  success: boolean;
  error?: string;
}

export interface SyncSlice {
  syncStartedAt?: number;
  startSync: () => void;
  syncCompletedAt?: number;
  syncResult: SyncResult | null;
  setSyncResult: (result: SyncResult | null) => void;
}

export const createSyncSlice: StateCreator<SyncSlice> = (set) => ({
  syncStartedAt: undefined,
  startSync: () => set({ syncStartedAt: Date.now(), syncResult: null }),
  syncCompletedAt: undefined,
  syncResult: null,
  setSyncResult: (result: SyncResult | null) =>
    set({ syncResult: result, syncCompletedAt: Date.now() }),
});
