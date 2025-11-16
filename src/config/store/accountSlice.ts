import { StateCreator } from "zustand";
import { Account } from "@/api/types/account";
import { ApiClient } from "@/api/client";

export interface AccountSlice {
  account: Account | null | undefined;
  fetchAccount: () => Promise<void>;
}

export const createAccountSlice: StateCreator<AccountSlice> = (set, _get) => ({
  account: undefined,
  fetchAccount: async () => {
    try {
      const account = await ApiClient.getAccount();
      set({ account });
    } catch (error) {
      console.error("Error fetching account:", error);
    }
  },
});
