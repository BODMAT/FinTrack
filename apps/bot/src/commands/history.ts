import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../context.js";
import { api } from "../services/apiClient.js";
import { navRow } from "../utils/pagination.js";
import { formatHistory, type HistoryResponse } from "./history.format.js";

const composer = new Composer<MyContext>();

const PER_PAGE = 10;

async function loadPage(telegramId: number, page: number) {
  const res = await api.get(
    telegramId,
    `/transactions?page=${page}&perPage=${PER_PAGE}`,
  );
  if (!res.ok) return null;
  return (await res.json()) as HistoryResponse;
}

function buildKeyboard(data: HistoryResponse): InlineKeyboard | undefined {
  const kb = new InlineKeyboard();
  const page = data.pagination?.page ?? 1;
  const totalPages = data.pagination?.totalPages ?? 1;
  return navRow(kb, "hpg", page, totalPages) ? kb : undefined;
}

composer.command("history", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const data = await loadPage(telegramId, 1);
  if (!data) {
    await ctx.reply("Failed to load history. Please try again.");
    return;
  }

  const kb = buildKeyboard(data);
  await ctx.reply(formatHistory(data), kb ? { reply_markup: kb } : undefined);
});

// ◀/▶ navigation: re-render the same message with the requested page.
composer.callbackQuery(/^hpg:(\d+)$/, async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.answerCallbackQuery();
    return;
  }

  const page = Number(ctx.match[1]);
  const data = await loadPage(telegramId, page);
  if (!data) {
    await ctx.answerCallbackQuery({ text: "Failed to load page." });
    return;
  }

  const kb = buildKeyboard(data);
  await ctx.editMessageText(
    formatHistory(data),
    kb ? { reply_markup: kb } : undefined,
  );
  await ctx.answerCallbackQuery();
});

export { composer as historyRouter };
