import { create } from "zustand";
import type { Range } from "@fintrack/types";

interface PeriodState {
  period: Range;
  setPeriod: (period: Range) => void;
}

export const usePeriodStore = create<PeriodState>()((set) => ({
  period: "all",
  setPeriod: (period: Range) => set({ period }),
}));
