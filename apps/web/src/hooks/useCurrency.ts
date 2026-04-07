"use client";
import { useQuery } from "@tanstack/react-query";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import {
  LANGUAGE_TO_CURRENCY,
  type CachedRatesPayload,
  type CurrencyCode,
  type SupportedRates,
} from "@/types/currency";

const FX_CACHE_KEY = "fintrack.fx.usd.v1";
const ONE_HOUR_MS = 60 * 60 * 1000;

const DEFAULT_RATES: SupportedRates = {
  USD: 1,
  UAH: 1,
  RUB: 1,
  EUR: 1,
};

function normalizeCurrency(value?: string): CurrencyCode {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "UAH") return "UAH";
  if (normalized === "RUB") return "RUB";
  if (normalized === "EUR") return "EUR";
  return "USD";
}

function readCachedRates(): CachedRatesPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedRatesPayload;
    if (!parsed?.updatedAt || !parsed?.rates) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedRates(payload: CachedRatesPayload) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FX_CACHE_KEY, JSON.stringify(payload));
}

async function fetchRatesFromApi(): Promise<CachedRatesPayload> {
  const response = await fetch("https://open.er-api.com/v6/latest/USD", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch exchange rates");
  }

  const json = (await response.json()) as {
    rates?: Record<string, number>;
  };

  const rates = json.rates ?? {};
  const payload: CachedRatesPayload = {
    base: "USD",
    updatedAt: Date.now(),
    rates: {
      USD: Number(rates.USD) || 1,
      UAH: Number(rates.UAH) || 1,
      RUB: Number(rates.RUB) || 1,
      EUR: Number(rates.EUR) || 1,
    },
  };

  writeCachedRates(payload);
  return payload;
}

function getLocaleByLanguage(language: string) {
  if (language === "uk") return "uk-UA";
  if (language === "ru") return "ru-RU";
  return "en-US";
}

export function useCurrency() {
  const { i18n } = useSafeTranslation();
  const language = i18n.language?.split("-")[0] || "en";
  const displayCurrency =
    LANGUAGE_TO_CURRENCY[language as keyof typeof LANGUAGE_TO_CURRENCY] ??
    "USD";

  const ratesQuery = useQuery({
    queryKey: ["fx-rates", "usd"],
    queryFn: async () => {
      const cached = readCachedRates();
      if (cached && Date.now() - cached.updatedAt < ONE_HOUR_MS) {
        return cached;
      }

      try {
        return await fetchRatesFromApi();
      } catch (error) {
        if (cached) return cached;
        throw error;
      }
    },
    staleTime: ONE_HOUR_MS,
    refetchInterval: ONE_HOUR_MS,
    retry: 1,
  });

  const rates = ratesQuery.data?.rates ?? DEFAULT_RATES;

  const convertAmount = (
    amount: number,
    fromInput?: string,
    toInput?: string,
  ) => {
    const from = normalizeCurrency(fromInput);
    const to = normalizeCurrency(toInput ?? displayCurrency);
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;
    const amountInUsd = from === "USD" ? amount : amount / fromRate;
    return to === "USD" ? amountInUsd : amountInUsd * toRate;
  };

  const formatMoney = (
    amount: number,
    currencyInput?: string,
    minimumFractionDigits: number = 2,
  ) => {
    const currency = normalizeCurrency(currencyInput ?? displayCurrency);
    return new Intl.NumberFormat(getLocaleByLanguage(language), {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits,
    }).format(amount);
  };

  return {
    displayCurrency: normalizeCurrency(displayCurrency),
    rates,
    isRatesLoading: ratesQuery.isLoading,
    isRatesError: ratesQuery.isError,
    convertAmount,
    formatMoney,
  };
}
