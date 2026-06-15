import type { HistoryTransaction } from "../commands/history.format.js";
import { formatAmount } from "./format.js";

export function txLabel(tx: HistoryTransaction): string {
  const emoji = tx.type === "INCOME" ? "🟢" : "🔴";
  const sign = tx.type === "INCOME" ? "+" : "-";
  const amount = formatAmount(tx.amount);
  const date = tx.created_at.slice(0, 10);
  const title = tx.title || "—";
  return `${emoji} ${date} ${title} ${sign}${amount} ${tx.currencyCode}`;
}
