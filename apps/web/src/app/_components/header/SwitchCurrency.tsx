"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { useCurrencyStore } from "@/store/currency";
import { SUPPORTED_CURRENCIES, type CurrencyCode } from "@/types/currency";

export function SwitchCurrency() {
  const { displayCurrency } = useCurrency();
  const setCurrency = useCurrencyStore((state) => state.setCurrency);

  return (
    <div className="mt-3 flex items-center justify-center rounded-[10px] border border-(--color-fixed-text) bg-(--color-card) p-1">
      {SUPPORTED_CURRENCIES.map((currency: CurrencyCode) => {
        const active = displayCurrency === currency;
        return (
          <button
            key={currency}
            type="button"
            onClick={() => setCurrency(currency)}
            className={`min-w-10.5 rounded-lg px-2 py-1.5 text-[12px] font-bold uppercase transitioned ${
              active
                ? "bg-(--color-hover-reverse) text-(--color-text)"
                : "cursor-pointer text-(--color-fixed-text) hover:text-(--color-hover)"
            }`}
          >
            {currency}
          </button>
        );
      })}
    </div>
  );
}
