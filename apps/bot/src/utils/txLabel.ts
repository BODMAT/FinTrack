import type { HistoryTransaction } from "../commands/history.format.js";

// Inline-button label for a transaction: "🟢 2026-06-15 Salary +1500.00 UAH".
export function txLabel(tx: HistoryTransaction): string {
  const emoji = tx.type === "INCOME" ? "🟢" : "🔴";
  const sign = tx.type === "INCOME" ? "+" : "-";
  const n = typeof tx.amount === "number" ? tx.amount : parseFloat(tx.amount);
  const amount = Number.isFinite(n) ? n.toFixed(2) : "0.00";
  const date = tx.created_at.slice(0, 10);
  const title = tx.title || "—";
  return `${emoji} ${date} ${title} ${sign}${amount} ${tx.currencyCode}`;
}
