import {
  groupData,
  getFullStats,
} from "../../../src/modules/summary/helpers.js";

const NOW = new Date("2025-06-15T14:00:00.000Z");

function tx(
  id: string,
  type: "INCOME" | "EXPENSE",
  amount: number,
  created_at: Date,
) {
  return {
    id,
    title: id,
    type,
    amount,
    currencyCode: "USD" as const,
    source: "MANUAL" as const,
    category: null,
    created_at,
    updated_at: created_at,
    location: null,
  };
}

// Transactions that fall within the reference NOW date
const todayIncome = tx("t1", "INCOME", 1000, new Date("2025-06-15T09:00:00Z"));
const todayOutcome = tx("t2", "EXPENSE", 300, new Date("2025-06-15T10:00:00Z"));
const oldTx = tx("t3", "INCOME", 500, new Date("2024-01-01T00:00:00Z"));

describe("groupData", () => {
  it("returns empty arrays for empty input", () => {
    const result = groupData([], "all", NOW);
    expect(result.labels).toHaveLength(0);
    expect(result.income).toHaveLength(0);
    expect(result.outcome).toHaveLength(0);
  });

  describe("range=day", () => {
    it("includes only transactions from the same day as nowDate", () => {
      const result = groupData([todayIncome, oldTx], "day", NOW);
      expect(result.income.reduce((a, b) => a + b, 0)).toBe(1000);
    });

    it("filters out transactions from other days", () => {
      const result = groupData([oldTx], "day", NOW);
      expect(result.labels).toHaveLength(0);
    });

    it("groups by hour bucket", () => {
      const hour9 = tx("h9", "INCOME", 100, new Date(2025, 5, 15, 9, 30, 0));
      const hour9b = tx("h9b", "EXPENSE", 50, new Date(2025, 5, 15, 9, 45, 0));
      const result = groupData([hour9, hour9b], "day", NOW);
      expect(result.labels).toHaveLength(1);
      expect(result.labels[0]).toBe("09:00");
      expect(result.income[0]).toBe(100);
      expect(result.outcome[0]).toBe(50);
    });
  });

  describe("range=week", () => {
    it("includes transactions within the current week", () => {
      // NOW is Sunday 2025-06-15; week starts Mon 2025-06-09
      const monTx = tx("mon", "INCOME", 200, new Date("2025-06-09T10:00:00Z"));
      const result = groupData([monTx, oldTx], "week", NOW);
      expect(result.income.reduce((a, b) => a + b, 0)).toBe(200);
    });

    it("excludes transactions before the week start", () => {
      const result = groupData([oldTx], "week", NOW);
      expect(result.labels).toHaveLength(0);
    });
  });

  describe("range=month", () => {
    it("includes transactions from this month", () => {
      const result = groupData([todayIncome, todayOutcome], "month", NOW);
      const totalIncome = result.income.reduce((a, b) => a + b, 0);
      const totalOutcome = result.outcome.reduce((a, b) => a + b, 0);
      expect(totalIncome).toBe(1000);
      expect(totalOutcome).toBe(300);
    });

    it("excludes transactions from prior months", () => {
      const result = groupData([oldTx], "month", NOW);
      expect(result.labels).toHaveLength(0);
    });
  });

  describe("range=all", () => {
    it("includes every transaction regardless of date", () => {
      const result = groupData([todayIncome, oldTx], "all", NOW);
      const totalIncome = result.income.reduce((a, b) => a + b, 0);
      expect(totalIncome).toBe(1500);
    });
  });

  describe("sorting", () => {
    it("labels are sorted chronologically", () => {
      const early = tx("e", "INCOME", 10, new Date("2025-06-13T10:00:00Z"));
      const late = tx("l", "INCOME", 20, new Date("2025-06-14T10:00:00Z"));
      const result = groupData([late, early], "week", NOW);
      expect(result.income[0]).toBe(10);
      expect(result.income[1]).toBe(20);
    });
  });

  describe("aggregation", () => {
    it("multiple transactions on same hour bucket are summed", () => {
      const a = tx("a", "INCOME", 100, new Date("2025-06-15T10:00:00Z"));
      const b = tx("b", "INCOME", 200, new Date("2025-06-15T10:30:00Z"));
      const result = groupData([a, b], "day", NOW);
      expect(result.labels).toHaveLength(1);
      expect(result.income[0]).toBe(300);
    });
  });
});

describe("getFullStats", () => {
  it("empty data → currentBalance=0, all top transactions='0'", () => {
    const stats = getFullStats([]);
    expect(stats.currentBalance).toBe(0);
    expect(stats.topTransaction.maxPositiveTransaction).toBe("0");
    expect(stats.topTransaction.maxNegativeTransaction).toBe("0");
  });

  it("income only → positive balance", () => {
    const stats = getFullStats([todayIncome]);
    expect(stats.currentBalance).toBe(1000);
  });

  it("outcome only → negative balance", () => {
    const stats = getFullStats([todayOutcome]);
    expect(stats.currentBalance).toBe(-300);
  });

  it("income - outcome = correct balance", () => {
    const stats = getFullStats([todayIncome, todayOutcome]);
    expect(stats.currentBalance).toBe(700);
  });

  it("balance is sum of all-time transactions regardless of date", () => {
    // oldTx (income 500) + todayIncome (income 1000) - todayOutcome (outcome 300) = 1200
    const stats = getFullStats([todayIncome, todayOutcome, oldTx]);
    expect(stats.currentBalance).toBe(1200);
  });

  it("maxPositiveTransaction is highest income amount", () => {
    const big = tx("big", "INCOME", 9999, NOW);
    const small = tx("small", "INCOME", 1, NOW);
    const stats = getFullStats([big, small]);
    expect(stats.topTransaction.maxPositiveTransaction).toBe("9999");
  });

  it("minPositiveTransaction is lowest income amount", () => {
    const big = tx("big", "INCOME", 9999, NOW);
    const small = tx("small", "INCOME", 1, NOW);
    const stats = getFullStats([big, small]);
    expect(stats.topTransaction.minPositiveTransaction).toBe("1");
  });

  it("maxNegativeTransaction is highest outcome amount", () => {
    const a = tx("a", "EXPENSE", 50, NOW);
    const b = tx("b", "EXPENSE", 200, NOW);
    const stats = getFullStats([a, b]);
    expect(stats.topTransaction.maxNegativeTransaction).toBe("200");
  });

  it("minNegativeTransaction is lowest outcome amount", () => {
    const a = tx("a", "EXPENSE", 50, NOW);
    const b = tx("b", "EXPENSE", 200, NOW);
    const stats = getFullStats([a, b]);
    expect(stats.topTransaction.minNegativeTransaction).toBe("50");
  });

  it("returns all required stat fields", () => {
    const stats = getFullStats([]);
    expect(stats).toHaveProperty("currentBalance");
    expect(stats).toHaveProperty("dataStatsPerDay");
    expect(stats).toHaveProperty("dataStatsPerWeek");
    expect(stats).toHaveProperty("dataStatsPerMonth");
    expect(stats).toHaveProperty("dataStatsPerYear");
    expect(stats).toHaveProperty("dataStatsPerAllTime");
    expect(stats).toHaveProperty("topTransaction");
  });

  it("each stat range has the 6 expected sub-fields", () => {
    const stats = getFullStats([]);
    for (const key of [
      "dataStatsPerDay",
      "dataStatsPerWeek",
      "dataStatsPerMonth",
      "dataStatsPerYear",
      "dataStatsPerAllTime",
    ] as const) {
      const s = stats[key];
      expect(s).toHaveProperty("totalIncomePerRange");
      expect(s).toHaveProperty("totalOutcomePerRange");
      expect(s).toHaveProperty("totalSavingPerRange");
      expect(s).toHaveProperty("percentageIncomePerRange");
      expect(s).toHaveProperty("percentageOutcomePerRange");
      expect(s).toHaveProperty("percentageSavingPerRange");
    }
  });
});
