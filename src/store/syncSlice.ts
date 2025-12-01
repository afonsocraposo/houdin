import { StateCreator } from "zustand";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export interface SyncResult {
  success: boolean;
  error?: string;
  timestamp: number;
}

export interface SyncSlice {
  syncStartedAt?: number;
  startSync: () => void;
  syncCompletedAt?: number;
  syncResult?: SyncResult;
  setSyncResult: (result: Omit<SyncResult, "timestamp">) => void;
}

export const createSyncSlice: StateCreator<SyncSlice> = (set) => ({
  syncStartedAt: undefined,
  startSync: () => set({ syncStartedAt: Date.now() }),
  syncCompletedAt: undefined,
  setSyncResult: (result: Omit<SyncResult, "timestamp">) => {
    const now = Date.now();
    set({ syncResult: { ...result, timestamp: now }, syncCompletedAt: now });
  },
});
