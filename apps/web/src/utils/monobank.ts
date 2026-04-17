import type { Range } from "@fintrack/types";
import type { StatsTransaction } from "@/types/monobank-ui";

export const CHART_INCOME_COLOR = "#00c07a";
export const CHART_OUTCOME_COLOR = "#ff4d5f";

export const rangeOptions: Array<{ value: Range; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "all", label: "All time" },
];

export function extractErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  return "Request failed.";
}

export function getStartOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(date.getDate() - diff);
  return start;
}

export function getPreviousDateByRange(range: Range): Date {
  const now = new Date();
  if (range === "day")
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (range === "week")
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  if (range === "month")
    return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  if (range === "year")
    return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  return new Date(0);
}

export function filterByRange(
  items: StatsTransaction[],
  range: Range,
  nowDate: Date = new Date(),
) {
  if (range === "all") return items;

  return items.filter((item) => {
    const date = item.createdAt;
    if (range === "day") return date.toDateString() === nowDate.toDateString();
    if (range === "week") {
      const start = getStartOfWeek(nowDate);
      return date >= start && date <= nowDate;
    }
    if (range === "month") {
      const start = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      return date >= start && date <= nowDate;
    }
    const start = new Date(nowDate.getFullYear(), 0, 1);
    return date >= start && date <= nowDate;
  });
}

export function getTotals(items: StatsTransaction[]) {
  const income = items
    .filter((item) => item.type === "INCOME")
    .reduce((acc, item) => acc + item.amount, 0);
  const outcome = items
    .filter((item) => item.type === "EXPENSE")
    .reduce((acc, item) => acc + item.amount, 0);
  const saving = income - outcome;
  const balance = saving;

  return { income, outcome, saving, balance };
}

export function getPercentage(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function buildChartData(items: StatsTransaction[], range: Range) {
  const map = new Map<
    string,
    { income: number; outcome: number; rawDate: Date }
  >();
  const now = new Date();
  const filtered = filterByRange(items, range, now);

  filtered.forEach((item) => {
    const date = new Date(item.createdAt);
    let key = "";
    let rawDate = new Date(date);

    if (range === "day") {
      key = `${date.getHours().toString().padStart(2, "0")}:00`;
      rawDate.setMinutes(0, 0, 0);
    } else if (range === "week") {
      key = date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
      rawDate.setHours(0, 0, 0, 0);
    } else if (range === "month") {
      const week = Math.ceil(date.getDate() / 7);
      key = `Week ${week}`;
      rawDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        (week - 1) * 7 + 1,
      );
    } else if (range === "year") {
      key = date.toLocaleString("en-GB", { month: "short" });
      rawDate = new Date(date.getFullYear(), date.getMonth(), 1);
    } else {
      key = date.toLocaleString("en-GB", { month: "short", year: "numeric" });
      rawDate = new Date(date.getFullYear(), date.getMonth(), 1);
    }

    const group = map.get(key) || { income: 0, outcome: 0, rawDate };
    if (item.type === "INCOME") group.income += item.amount;
    else group.outcome += item.amount;
    map.set(key, group);
  });

  const sorted = Array.from(map.entries()).sort(
    (a, b) => a[1].rawDate.getTime() - b[1].rawDate.getTime(),
  );
  return {
    labels: sorted.map(([label]) => label),
    income: sorted.map(([, value]) => value.income),
    outcome: sorted.map(([, value]) => value.outcome),
  };
}

function getTransactionFingerprint(item: StatsTransaction) {
  return `${item.title}|${item.type}|${item.amount}|${item.currencyCode}|${item.createdAt.toISOString()}`;
}

export function mergeUniqueTransactions(
  current: StatsTransaction[],
  incoming: StatsTransaction[],
) {
  const seen = new Set(current.map(getTransactionFingerprint));
  const merged = [...current];

  incoming.forEach((item) => {
    const fingerprint = getTransactionFingerprint(item);
    if (seen.has(fingerprint)) return;
    seen.add(fingerprint);
    merged.push(item);
  });

  return merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
