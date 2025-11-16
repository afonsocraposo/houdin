import { StateCreator } from "zustand";
import { Account } from "@/api/types/account";

export interface AccountSlice {
  account: Account | null | undefined;
  setAccount: (account: Account | null) => void;
}

export const createAccountSlice: StateCreator<AccountSlice> = (set) => ({
  account: undefined,
  setAccount: (account) => set({ account }),
});
