import { StateCreator } from "zustand";

export interface SettingsSlice {
  settings: {
    syncEnabled: boolean;
    generationProvider: "houdin" | "openai" | "openrouter" | "custom";
    model: string;
    customProviderUrl: string;
    credentialId: string | null;
  };
  setSettings: (settings: Partial<SettingsSlice["settings"]>) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  settings: {
    syncEnabled: true,
    generationProvider: "houdin",
    model: "",
    customProviderUrl: "",
    credentialId: null,
  },
  setSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
      },
    })),
});
