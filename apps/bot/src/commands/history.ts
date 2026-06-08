import { Composer } from "grammy";
import type { MyContext } from "../context.js";
import { api } from "../services/apiClient.js";
import { formatHistory, type HistoryResponse } from "./history.format.js";

const composer = new Composer<MyContext>();

composer.command("history", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const res = await api.get(telegramId, "/transactions?page=1&perPage=10");
  if (!res.ok) {
    await ctx.reply("Failed to load history. Please try again.");
    return;
  }

  const data = (await res.json()) as HistoryResponse;
  await ctx.reply(formatHistory(data));
});

export { composer as historyRouter };
