import { Composer } from "grammy";
import type { MyContext } from "../context.js";
import { api } from "../services/apiClient.js";

type SummaryPerRange = {
  totalIncomePerRange: number;
  totalOutcomePerRange: number;
  totalSavingPerRange: number;
  percentageIncomePerRange: number;
  percentageOutcomePerRange: number;
  percentageSavingPerRange: number;
};

type Summary = {
  currentBalance: number;
  dataStatsPerMonth: SummaryPerRange;
  dataStatsPerAllTime: SummaryPerRange;
};

const composer = new Composer<MyContext>();

composer.command("summary", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const res = await api.get(telegramId, "/summary");
  if (!res.ok) {
    await ctx.reply("Failed to load summary. Please try again.");
    return;
  }

  const data = (await res.json()) as Summary;
  const { currentBalance, dataStatsPerMonth, dataStatsPerAllTime } = data;

  const fmt = (n: number) => n.toFixed(2);
  const pct = (n: number) => (n >= 0 ? `+${n}%` : `${n}%`);

  const text = [
    `💰 *Balance:* ${fmt(currentBalance)}`,
    ``,
    `📅 *This month:*`,
    `  Income:  ${fmt(dataStatsPerMonth.totalIncomePerRange)} (${pct(dataStatsPerMonth.percentageIncomePerRange)})`,
    `  Expense: ${fmt(dataStatsPerMonth.totalOutcomePerRange)} (${pct(dataStatsPerMonth.percentageOutcomePerRange)})`,
    `  Saving:  ${fmt(dataStatsPerMonth.totalSavingPerRange)} (${pct(dataStatsPerMonth.percentageSavingPerRange)})`,
    ``,
    `📊 *All time:*`,
    `  Income:  ${fmt(dataStatsPerAllTime.totalIncomePerRange)}`,
    `  Expense: ${fmt(dataStatsPerAllTime.totalOutcomePerRange)}`,
    `  Saving:  ${fmt(dataStatsPerAllTime.totalSavingPerRange)}`,
  ].join("\n");

  await ctx.reply(text, { parse_mode: "Markdown" });
});

export { composer as summaryRouter };
