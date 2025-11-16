import { create } from 'zustand';
import { AccountSlice, createAccountSlice } from './accountSlice';

type StoreState = AccountSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createAccountSlice(...a),
}));
