import { create } from 'zustand';
import { AccountSlice, createAccountSlice } from './accountSlice';
import { SyncSlice, createSyncSlice } from './syncSlice';

type StoreState = AccountSlice & SyncSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createAccountSlice(...a),
  ...createSyncSlice(...a),
}));
