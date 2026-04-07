import type {
  Range as CustomDate,
  MoneyType,
  ResponseTransaction as IData,
  ISummaryPerRange as IDataStatsPerRange,
  ISummary as IDataStats,
} from "@fintrack/types";

export function groupData(data: IData[], range: CustomDate, nowDate?: Date) {
  const now = nowDate || new Date();

  function getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    start.setDate(date.getDate() - diff);
    return start;
  }

  const map = new Map<
    string,
    { income: number; outcome: number; rawDate: Date }
  >();

  const filtered = data.filter((item) => {
    if (!item.created_at) return false;
    const date = item.created_at;

    if (range === "day") {
      return date.toDateString() === now.toDateString();
    }

    if (range === "week") {
      const startOfWeek = getStartOfWeek(now);
      return date >= startOfWeek && date <= now;
    }

    if (range === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= startOfMonth && date <= now;
    }

    if (range === "year") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return date >= startOfYear && date <= now;
    }

    if (range === "all") {
      return true;
    }

    return false;
  });

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
    } else if (
      range === "week" ||
      range === "month" ||
      range === "year" ||
      range === "all"
    ) {
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

  const income = sortedEntries.map(([_, val]) => val.income);
  const outcome = sortedEntries.map(([_, val]) => val.outcome);
  const labels = sortedEntries.map(([label]) => label);

  return { labels, income, outcome };
}

function shiftDateByRange(date: Date, range: CustomDate): Date {
  const shifted = new Date(date);
  if (range === "day") shifted.setDate(shifted.getDate() - 1);
  else if (range === "week") shifted.setDate(shifted.getDate() - 7);
  else if (range === "month") shifted.setMonth(shifted.getMonth() - 1);
  else if (range === "year") shifted.setFullYear(shifted.getFullYear() - 1);
  return shifted;
}

function getRangeInterval(range: CustomDate, now: Date = new Date()) {
  if (range === "day") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: now,
    };
  }
  if (range === "week") {
    const startOfWeek = (() => {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(now.getDate() - diff);
      return start;
    })();
    return { start: startOfWeek, end: now };
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

function filterByInterval(data: IData[], start: Date, end: Date) {
  return data.filter((item) => {
    if (!item.created_at) return false;
    const date = item.created_at;
    return date >= start && date <= end;
  });
}

function aggregateTotal(items: IData[], title: MoneyType) {
  const income = items
    .filter((item) => item.type === "INCOME")
    .reduce((acc, cur) => acc + Number(cur.amount), 0);
  const outcome = items
    .filter((item) => item.type !== "INCOME")
    .reduce((acc, cur) => acc + Number(cur.amount), 0);

  if (title === "income") return income;
  if (title === "outcome") return outcome;
  if (title === "saving") return income - outcome;
  return income - outcome;
}

function getTotalOfRange(
  data: IData[],
  range: CustomDate,
  title: MoneyType,
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

  const { income, outcome } = groupData(data, range, nowDate);

  if (title === "income") return income.reduce((acc, cur) => acc + cur, 0);
  if (title === "outcome") return outcome.reduce((acc, cur) => acc + cur, 0);
  if (title === "saving")
    return (
      income.reduce((acc, cur) => acc + cur, 0) -
      outcome.reduce((acc, cur) => acc + cur, 0)
    );

  return 0;
}

function getPercentageOfRangeIncrease(
  data: IData[],
  range: CustomDate,
  title: MoneyType,
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

function getStatsPerRange(
  data: IData[],
  range: CustomDate,
): IDataStatsPerRange {
  const totalIncomePerRange = getTotalOfRange(data, range, "income");
  const percentageIncomePerRange = getPercentageOfRangeIncrease(
    data,
    range,
    "income",
  );
  const totalOutcomePerRange = getTotalOfRange(data, range, "outcome");
  const percentageOutcomePerRange = getPercentageOfRangeIncrease(
    data,
    range,
    "outcome",
  );
  const totalSavingPerRange = getTotalOfRange(data, range, "saving");
  const percentageSavingPerRange = getPercentageOfRangeIncrease(
    data,
    range,
    "saving",
  );

  return {
    totalIncomePerRange,
    totalOutcomePerRange,
    totalSavingPerRange,
    percentageIncomePerRange,
    percentageOutcomePerRange,
    percentageSavingPerRange,
  };
}

export function getFullStats(data: IData[]): IDataStats {
  const currentBalance = getTotalOfRange(data, "all", "balance");

  const dataStatsPerDay = getStatsPerRange(data, "day");
  const dataStatsPerWeek = getStatsPerRange(data, "week");
  const dataStatsPerMonth = getStatsPerRange(data, "month");
  const dataStatsPerYear = getStatsPerRange(data, "year");
  const dataStatsPerAllTime = getStatsPerRange(data, "all");

  const getTopAmount = (
    filterFn: (i: IData) => boolean,
    sortFn: (a: IData, b: IData) => number,
  ) => data.filter(filterFn).sort(sortFn)[0]?.amount.toString() || "0";

  const topTransaction = {
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
  };

  return {
    currentBalance,
    dataStatsPerDay,
    dataStatsPerWeek,
    dataStatsPerMonth,
    dataStatsPerYear,
    dataStatsPerAllTime,
    topTransaction,
  };
}
