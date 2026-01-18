import { create } from "zustand";
import type { CustomDate } from "../types/custom";

interface PeriodState {
	period: CustomDate;
	setPeriod: (period: CustomDate) => void;
}

export const usePeriodStore = create<PeriodState>()((set) => ({
	period: "all",
	setPeriod: (period: CustomDate) => set({ period }),
}));
