import z from "zod";

export const RangeSchema = z.enum(["day", "week", "month", "year", "all"]);
export const MoneyTypeSchema = z.enum([
  "income",
  "outcome",
  "saving",
  "balance",
]);
export const SummaryPerRangeSchema = z.object({
  totalIncomePerRange: z.number().nonnegative(),
  percentageIncomePerRange: z.number(),

  totalOutcomePerRange: z.number().nonnegative(),
  percentageOutcomePerRange: z.number(),

  totalSavingPerRange: z.number(),
  percentageSavingPerRange: z.number(),
});

export const AllSummarySchema = z.object({
  currentBalance: z.number(),

  dataStatsPerDay: SummaryPerRangeSchema,
  dataStatsPerWeek: SummaryPerRangeSchema,
  dataStatsPerMonth: SummaryPerRangeSchema,
  dataStatsPerYear: SummaryPerRangeSchema,
  dataStatsPerAllTime: SummaryPerRangeSchema,

  topTransaction: z.object({
    maxPositiveTransaction: z.string(),
    maxNegativeTransaction: z.string(),
    minPositiveTransaction: z.string(),
    minNegativeTransaction: z.string(),
  }),
});

export const ChartDataSchema = z.object({
  labels: z.array(z.string()),
  income: z.array(z.number()),
  outcome: z.array(z.number()),
});

export type Range = z.infer<typeof RangeSchema>;
export type ISummaryPerRange = z.infer<typeof SummaryPerRangeSchema>;
export type ISummary = z.infer<typeof AllSummarySchema>;
export type IChartData = z.infer<typeof ChartDataSchema>;
export type MoneyType = z.infer<typeof MoneyTypeSchema>;
