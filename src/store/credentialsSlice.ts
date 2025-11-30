import { Credential } from "@/types/credentials";
import { StateCreator } from "zustand";

export interface CredentialsSlice {
  credentials: Credential[];
  setCredentials: (credentials: Credential[]) => void;
  getCredentialsByType: (type: string) => Credential[];
}

export const createCredentialsSlice: StateCreator<CredentialsSlice> = (
  set,
  get,
) => ({
  credentials: [],
  setCredentials: (credentials: Credential[]) => set(() => ({ credentials })),
  getCredentialsByType: (type: string) => {
    const { credentials } = get();
    return credentials.filter((cred) => cred.type === type);
  },
});
