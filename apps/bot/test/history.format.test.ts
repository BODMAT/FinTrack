import { formatHistory } from "../src/commands/history.format.js";

describe("formatHistory", () => {
  it("renders empty state when no transactions", () => {
    expect(formatHistory({ data: [] })).toBe("📭 No transactions yet.");
  });

  it("renders income with + and expense with -", () => {
    const out = formatHistory({
      data: [
        {
          id: "1",
          title: "Salary",
          type: "INCOME",
          amount: "1000",
          currencyCode: "USD",
          created_at: "2026-06-01T10:00:00.000Z",
        },
        {
          id: "2",
          title: "Coffee",
          type: "EXPENSE",
          amount: 4.5,
          currencyCode: "USD",
          created_at: "2026-06-02T08:00:00.000Z",
        },
      ],
    });
    expect(out).toContain("🟢 2026-06-01 — Salary: +1000.00 USD");
    expect(out).toContain("🔴 2026-06-02 — Coffee: -4.50 USD");
  });

  it("parses Prisma Decimal string amounts", () => {
    const out = formatHistory({
      data: [
        {
          id: "1",
          title: "Groceries",
          type: "EXPENSE",
          amount: "12.5",
          currencyCode: "EUR",
          created_at: "2026-06-01T00:00:00.000Z",
        },
      ],
    });
    expect(out).toContain("-12.50 EUR");
  });

  it("falls back to dash for empty title", () => {
    const out = formatHistory({
      data: [
        {
          id: "1",
          title: "",
          type: "INCOME",
          amount: "1",
          currencyCode: "USD",
          created_at: "2026-06-01T00:00:00.000Z",
        },
      ],
    });
    expect(out).toContain("🟢 2026-06-01 — —: +1.00 USD");
  });

  it("appends pagination footer when present", () => {
    const out = formatHistory({
      data: [
        {
          id: "1",
          title: "X",
          type: "INCOME",
          amount: "1",
          currencyCode: "USD",
          created_at: "2026-06-01T00:00:00.000Z",
        },
      ],
      pagination: { page: 1, perPage: 10, total: 23, totalPages: 3 },
    });
    expect(out).toContain("Page 1/3 · 23 total");
  });

  it("keeps raw value for invalid date", () => {
    const out = formatHistory({
      data: [
        {
          id: "1",
          title: "X",
          type: "INCOME",
          amount: "1",
          currencyCode: "USD",
          created_at: "not-a-date",
        },
      ],
    });
    expect(out).toContain("not-a-date");
  });
});
