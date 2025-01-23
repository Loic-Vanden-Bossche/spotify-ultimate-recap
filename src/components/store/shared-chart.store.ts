import { create } from "zustand/index";
import type { SharedChartFullData } from "../../models/shared-chart-full-data.ts";

type SharedChartStore = {
  sharedChart: SharedChartFullData | null;
  setSharedChart: (sharedChart: SharedChartFullData) => void;
};

export const useSharedChartStore = create<SharedChartStore>((set) => ({
  sharedChart: null,
  setSharedChart: (sharedChart) => set({ sharedChart }),
}));
