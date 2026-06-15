import { formatAmount } from "../utils/format.js";

export type HistoryTransaction = {
  id: string;
  title: string;
  type: "INCOME" | "EXPENSE";
  amount: string | number;
  currencyCode: string;
  created_at: string;
  source?: "MANUAL" | "MONOBANK";
};

export type HistoryResponse = {
  data: HistoryTransaction[];
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

export function formatHistory(res: HistoryResponse): string {
  if (!res.data || res.data.length === 0) {
    return "📭 No transactions yet.";
  }

  const lines = res.data.map((tx) => {
    const emoji = tx.type === "INCOME" ? "🟢" : "🔴";
    const sign = tx.type === "INCOME" ? "+" : "-";
    const date = formatDate(tx.created_at);
    const title = tx.title || "—";
    return `${emoji} ${date} — ${title}: ${sign}${formatAmount(tx.amount)} ${tx.currencyCode}`;
  });

  const header = "🧾 Recent transactions:";
  let footer = "";
  if (res.pagination) {
    const { page, totalPages, total } = res.pagination;
    footer = `\n\nPage ${page}/${totalPages} · ${total} total`;
  }

  return `${header}\n\n${lines.join("\n")}${footer}`;
}
