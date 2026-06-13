import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { CurrencyCode } from "@/types/currency";

interface CurrencyState {
  // null means the user has not explicitly chosen a currency yet,
  // so the display currency falls back to the one derived from language.
  selectedCurrency: CurrencyCode | null;
  setCurrency: (currency: CurrencyCode) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    devtools((set) => ({
      selectedCurrency: null,
      setCurrency: (currency) => set({ selectedCurrency: currency }),
    })),
    {
      name: "currency-fintrack",
    },
  ),
);
