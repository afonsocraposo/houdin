import { StateCreator } from "zustand";

export interface SettingsSlice {
  settings: {
    sync: {
      enabled: boolean;
    };
    workfowGeneration: {
      provider: "houdin" | "openai" | "openrouter" | "custom";
      model: string;
      providerUrl: string;
      credentialId: string | null;
      expandTools: boolean;
    };
    general: {
      analytics: boolean;
    };
  };
  setSettings: (settings: Partial<SettingsSlice["settings"]>) => void;
}

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  settings: {
    sync: {
      enabled: true,
    },
    workfowGeneration: {
      provider: "houdin",
      model: "",
      providerUrl: "",
      credentialId: null,
      expandTools: true,
    },
    general: {
      analytics: true,
    },
  },
  setSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
      },
    })),
});
