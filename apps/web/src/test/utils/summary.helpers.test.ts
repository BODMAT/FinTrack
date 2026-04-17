import { describe, expect, it } from "vitest";
import {
  buildChartData,
  buildSummary,
  normalizeTransactionsForSummary,
} from "@/utils/summary.helpers";

describe("summary.helpers", () => {
  const tx = [
    {
      id: "1",
      title: "Salary",
      type: "INCOME" as const,
      amount: 1000,
      created_at: new Date("2026-04-15T10:00:00.000Z"),
    },
    {
      id: "2",
      title: "Food",
      type: "EXPENSE" as const,
      amount: 200,
      created_at: new Date("2026-04-15T12:00:00.000Z"),
    },
    {
      id: "3",
      title: "Bonus",
      type: "INCOME" as const,
      amount: 300,
      created_at: new Date("2026-04-16T09:00:00.000Z"),
    },
  ];

  it("builds summary totals and top transactions", () => {
    const result = buildSummary(tx);

    expect(result.currentBalance).toBe(1100);
    expect(result.topTransaction.maxPositiveTransaction).toBe("1000");
    expect(result.topTransaction.maxNegativeTransaction).toBe("200");
  });

  it("builds chart data for all range in chronological order", () => {
    const result = buildChartData(tx, "all");

    expect(result.labels.length).toBe(2);
    expect(result.income).toEqual([1000, 300]);
    expect(result.outcome).toEqual([200, 0]);
  });

  it("normalizes transaction dates and amounts", () => {
    const normalized = normalizeTransactionsForSummary([
      {
        id: "1",
        title: "Salary",
        type: "INCOME",
        amount: "1000",
        currencyCode: "USD",
        source: "MANUAL",
        created_at: "2026-04-15T10:00:00.000Z",
        updated_at: "2026-04-15T10:00:00.000Z",
        location: null,
      },
    ]);

    expect(normalized[0]?.amount).toBe(1000);
    expect(normalized[0]?.created_at).toBeInstanceOf(Date);
  });
});
