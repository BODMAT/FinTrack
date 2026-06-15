import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../context.js";
import { api } from "../services/apiClient.js";
import { navRow } from "../utils/pagination.js";
import type { HistoryResponse, HistoryTransaction } from "./history.format.js";

const composer = new Composer<MyContext>();

const PER_PAGE = 10;

function buttonLabel(tx: HistoryTransaction): string {
  const emoji = tx.type === "INCOME" ? "🟢" : "🔴";
  const sign = tx.type === "INCOME" ? "+" : "-";
  const n = typeof tx.amount === "number" ? tx.amount : parseFloat(tx.amount);
  const amount = Number.isFinite(n) ? n.toFixed(2) : "0.00";
  const date = tx.created_at.slice(0, 10);
  const title = tx.title || "—";
  return `${emoji} ${date} ${title} ${sign}${amount} ${tx.currencyCode}`;
}

type Picker = { text: string; keyboard: InlineKeyboard };

// Builds the picker for a page, or null on load failure / nothing to edit.
async function buildPicker(
  telegramId: number,
  page: number,
): Promise<Picker | null | "error"> {
  const res = await api.get(
    telegramId,
    `/transactions?page=${page}&perPage=${PER_PAGE}`,
  );
  if (!res.ok) return "error";

  const data = (await res.json()) as HistoryResponse;
  // Monobank transactions are read-only — never list them in the picker.
  const editable = (data.data ?? []).filter((tx) => tx.source !== "MONOBANK");
  if (editable.length === 0) return null;

  const kb = new InlineKeyboard();
  for (const tx of editable) {
    kb.text(buttonLabel(tx), `edit:${tx.id}`).row();
  }

  const p = data.pagination;
  const curPage = p?.page ?? 1;
  const totalPages = p?.totalPages ?? 1;
  navRow(kb, "epg", curPage, totalPages);

  return {
    text: `✏️ Pick a transaction to edit (page ${curPage}/${totalPages}):`,
    keyboard: kb,
  };
}

composer.command("edit", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const picker = await buildPicker(telegramId, 1);
  if (picker === "error") {
    await ctx.reply("Failed to load transactions. Please try again.");
    return;
  }
  if (picker === null) {
    await ctx.reply("📭 Nothing to edit.");
    return;
  }

  await ctx.reply(picker.text, { reply_markup: picker.keyboard });
});

// ◀/▶ navigation: re-render the picker on the requested page.
composer.callbackQuery(/^epg:(\d+)$/, async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.answerCallbackQuery();
    return;
  }

  const page = Number(ctx.match[1]);
  const picker = await buildPicker(telegramId, page);
  if (picker === "error") {
    await ctx.answerCallbackQuery({ text: "Failed to load page." });
    return;
  }
  if (picker === null) {
    await ctx.answerCallbackQuery({ text: "Nothing to edit here." });
    return;
  }

  await ctx.editMessageText(picker.text, { reply_markup: picker.keyboard });
  await ctx.answerCallbackQuery();
});

// User picked a transaction → enter conversation to collect the new value.
composer.callbackQuery(/^edit:(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("editTransactionConversation", id);
});

export { composer as editRouter };
