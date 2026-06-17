import { capitalizeFirstLetter } from "./capitalize.js";

export type ParsedTransaction = {
  amount: number; // signed, as typed (+income / -expense)
  absAmount: number;
  title: string;
  type: "INCOME" | "EXPENSE";
};

// Parses "+1500 salary" / "-50 coffee". Returns null when the amount is
// unreadable (caller decides how to report it).
export function parseTransaction(text: string): ParsedTransaction | null {
  const parts = text.trim().split(/\s+/);
  const rawAmount = parts[0] ?? "";
  const amount = parseFloat(rawAmount.replace(",", "."));
  if (!Number.isFinite(amount)) return null;

  const title = capitalizeFirstLetter(parts.slice(1).join(" ") || "");
  const type: "INCOME" | "EXPENSE" = amount >= 0 ? "INCOME" : "EXPENSE";
  return { amount, absAmount: Math.abs(amount), title, type };
}
