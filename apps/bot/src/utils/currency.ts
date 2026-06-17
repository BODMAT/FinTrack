import { Keyboard } from "grammy";
import type { MyContext } from "../context.js";

export const SUPPORTED_CURRENCIES = ["USD", "UAH", "EUR"] as const;
export type BotCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const KEEP_CURRENCY_LABEL = "↩️ Keep";

export function currencyKeyboard(): Keyboard {
  const kb = new Keyboard();
  for (const code of SUPPORTED_CURRENCIES) kb.text(code);
  return kb.resized();
}

export function currencyEditKeyboard(): Keyboard {
  const kb = new Keyboard();
  for (const code of SUPPORTED_CURRENCIES) kb.text(code);
  return kb.text(KEEP_CURRENCY_LABEL).resized();
}

function normalizeCurrency(text?: string): BotCurrency | undefined {
  const value = text?.trim().toUpperCase();
  return SUPPORTED_CURRENCIES.find((code) => code === value);
}

export function extractCurrency(ctx: MyContext): BotCurrency {
  return normalizeCurrency(ctx.message?.text) ?? "USD";
}

export function extractCurrencyEdit(ctx: MyContext): BotCurrency | undefined {
  return normalizeCurrency(ctx.message?.text);
}
