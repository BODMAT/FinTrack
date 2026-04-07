import type {
  ISummary,
  ISummaryPerRange,
  Range,
  ResponseTransaction,
} from "@fintrack/types";

type Tx = {
  amount: number;
  type: "INCOME" | "EXPENSE";
  created_at?: Date;
};

function getStartOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(date.getDate() - diff);
  return start;
}

function filterByRange(data: Tx[], range: Range, nowDate?: Date) {
  const now = nowDate || new Date();

  return data.filter((item) => {
    if (!item.created_at) return false;
    const date = item.created_at;
    if (range === "all") return true;
    if (range === "day") return date.toDateString() === now.toDateString();
    if (range === "week") {
      const startOfWeek = getStartOfWeek(now);
      return date >= startOfWeek && date <= now;
    }
    if (range === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= startOfMonth && date <= now;
    }
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return date >= startOfYear && date <= now;
  });
}

export function buildChartData(data: Tx[], range: Range) {
  const now = new Date();
  const filtered = filterByRange(data, range, now);

  const map = new Map<
    string,
    { income: number; outcome: number; rawDate: Date }
  >();
  for (const item of filtered) {
    if (!item.created_at) continue;
    const date = item.created_at;
    let key = "";
    let rawDate = new Date(date);

    if (range === "day") {
      const hour = date.getHours().toString().padStart(2, "0");
      key = `${hour}:00`;
      rawDate.setMinutes(0, 0, 0);
      rawDate.setHours(date.getHours());
    } else {
      key = date.toLocaleDateString("default", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      rawDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      rawDate.setHours(0, 0, 0, 0);
    }

    const group = map.get(key) || { income: 0, outcome: 0, rawDate };
    if (item.type === "INCOME") group.income += Number(item.amount);
    else group.outcome += Number(item.amount);
    map.set(key, group);
  }

  const sortedEntries = Array.from(map.entries()).sort(
    (a, b) => a[1].rawDate.getTime() - b[1].rawDate.getTime(),
  );

  return {
    labels: sortedEntries.map(([label]) => label),
    income: sortedEntries.map(([, value]) => value.income),
    outcome: sortedEntries.map(([, value]) => value.outcome),
  };
}

function shiftDateByRange(date: Date, range: Range): Date {
  const shifted = new Date(date);
  if (range === "day") shifted.setDate(shifted.getDate() - 1);
  else if (range === "week") shifted.setDate(shifted.getDate() - 7);
  else if (range === "month") shifted.setMonth(shifted.getMonth() - 1);
  else if (range === "year") shifted.setFullYear(shifted.getFullYear() - 1);
  return shifted;
}

function getRangeInterval(range: Range, now: Date = new Date()) {
  if (range === "day") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: now,
    };
  }
  if (range === "week") {
    return {
      start: getStartOfWeek(now),
      end: now,
    };
  }
  if (range === "month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now,
    };
  }
  if (range === "year") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: now,
    };
  }
  return {
    start: new Date(0),
    end: now,
  };
}

function filterByInterval(data: Tx[], start: Date, end: Date) {
  return data.filter((item) => {
    if (!item.created_at) return false;
    const date = item.created_at;
    return date >= start && date <= end;
  });
}

function aggregateTotal(items: Tx[], title: "income" | "outcome" | "saving") {
  const income = items
    .filter((item) => item.type === "INCOME")
    .reduce((acc, cur) => acc + Number(cur.amount), 0);
  const outcome = items
    .filter((item) => item.type !== "INCOME")
    .reduce((acc, cur) => acc + Number(cur.amount), 0);
  if (title === "income") return income;
  if (title === "outcome") return outcome;
  return income - outcome;
}

function getTotalOfRange(
  data: Tx[],
  range: Range,
  title: "income" | "outcome" | "saving" | "balance",
  nowDate?: Date,
): number {
  if (title === "balance") {
    const totalIncome = data
      .filter((item) => item.type === "INCOME")
      .reduce((acc, cur) => acc + Number(cur.amount), 0);
    const totalOutcome = data
      .filter((item) => item.type !== "INCOME")
      .reduce((acc, cur) => acc + Number(cur.amount), 0);
    return totalIncome - totalOutcome;
  }

  const filtered = filterByRange(data, range, nowDate);
  const income = filtered
    .filter((item) => item.type === "INCOME")
    .reduce((acc, cur) => acc + Number(cur.amount), 0);
  const outcome = filtered
    .filter((item) => item.type !== "INCOME")
    .reduce((acc, cur) => acc + Number(cur.amount), 0);

  if (title === "income") return income;
  if (title === "outcome") return outcome;
  return income - outcome;
}

function getPercentageOfRangeIncrease(
  data: Tx[],
  range: Range,
  title: "income" | "outcome" | "saving",
): number {
  if (range === "all") return 0;

  const now = new Date();
  const { start: currentStart, end: currentEnd } = getRangeInterval(range, now);
  const previousStart = shiftDateByRange(currentStart, range);
  const previousEnd = shiftDateByRange(currentEnd, range);

  const currentTotal = aggregateTotal(
    filterByInterval(data, currentStart, currentEnd),
    title,
  );
  const previousTotal = aggregateTotal(
    filterByInterval(data, previousStart, previousEnd),
    title,
  );

  if (previousTotal === 0) return 0;
  return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
}

function getStatsPerRange(data: Tx[], range: Range): ISummaryPerRange {
  return {
    totalIncomePerRange: getTotalOfRange(data, range, "income"),
    totalOutcomePerRange: getTotalOfRange(data, range, "outcome"),
    totalSavingPerRange: getTotalOfRange(data, range, "saving"),
    percentageIncomePerRange: getPercentageOfRangeIncrease(
      data,
      range,
      "income",
    ),
    percentageOutcomePerRange: getPercentageOfRangeIncrease(
      data,
      range,
      "outcome",
    ),
    percentageSavingPerRange: getPercentageOfRangeIncrease(
      data,
      range,
      "saving",
    ),
  };
}

export function buildSummary(data: Tx[]): ISummary {
  const getTopAmount = (
    filterFn: (i: Tx) => boolean,
    sortFn: (a: Tx, b: Tx) => number,
  ) => data.filter(filterFn).sort(sortFn)[0]?.amount.toString() || "0";

  return {
    currentBalance: getTotalOfRange(data, "all", "balance"),
    dataStatsPerDay: getStatsPerRange(data, "day"),
    dataStatsPerWeek: getStatsPerRange(data, "week"),
    dataStatsPerMonth: getStatsPerRange(data, "month"),
    dataStatsPerYear: getStatsPerRange(data, "year"),
    dataStatsPerAllTime: getStatsPerRange(data, "all"),
    topTransaction: {
      maxPositiveTransaction: getTopAmount(
        (i) => i.type === "INCOME",
        (a, b) => Number(b.amount) - Number(a.amount),
      ),
      maxNegativeTransaction: getTopAmount(
        (i) => i.type !== "INCOME",
        (a, b) => Number(b.amount) - Number(a.amount),
      ),
      minPositiveTransaction: getTopAmount(
        (i) => i.type === "INCOME",
        (a, b) => Number(a.amount) - Number(b.amount),
      ),
      minNegativeTransaction: getTopAmount(
        (i) => i.type !== "INCOME",
        (a, b) => Number(a.amount) - Number(b.amount),
      ),
    },
  };
}

export function normalizeTransactionsForSummary(
  data: ResponseTransaction[] | undefined,
): Tx[] {
  return (data ?? []).map((item) => ({
    type: item.type,
    amount: Number(item.amount),
    created_at: item.created_at ? new Date(item.created_at) : undefined,
  }));
}
