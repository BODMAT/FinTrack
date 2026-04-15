import z from "zod";
import { currencyCodeSchema } from "@fintrack/types";

export type CurrencyCode = z.infer<typeof currencyCodeSchema>;

export type SupportedRates = Record<CurrencyCode, number>;

export type CachedRatesPayload = {
  base: "USD";
  updatedAt: number;
  rates: SupportedRates;
};

export const LANGUAGE_TO_CURRENCY = {
  en: "USD",
  uk: "UAH",
  de: "EUR",
} as const;
