import { create } from "zustand/index";
import type { ChartsSettingsData } from "../ChartsSettings.tsx";

type SettingsStore = {
  settings: ChartsSettingsData | null;
  setSettings: (settings: ChartsSettingsData) => void;
};

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
}));
