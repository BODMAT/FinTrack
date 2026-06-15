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

// Builds the picker for a page, or null on load failure / nothing to delete.
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
  const deletable = (data.data ?? []).filter((tx) => tx.source !== "MONOBANK");
  if (deletable.length === 0) return null;

  const kb = new InlineKeyboard();
  for (const tx of deletable) {
    kb.text(buttonLabel(tx), `del:${tx.id}`).row();
  }

  const p = data.pagination;
  const curPage = p?.page ?? 1;
  const totalPages = p?.totalPages ?? 1;
  navRow(kb, "dpg", curPage, totalPages);

  return {
    text: `🗑 Pick a transaction to delete (page ${curPage}/${totalPages}):`,
    keyboard: kb,
  };
}

composer.command("delete", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const picker = await buildPicker(telegramId, 1);
  if (picker === "error") {
    await ctx.reply("Failed to load transactions. Please try again.");
    return;
  }
  if (picker === null) {
    await ctx.reply("📭 Nothing to delete.");
    return;
  }

  await ctx.reply(picker.text, { reply_markup: picker.keyboard });
});

// ◀/▶ navigation: re-render the picker on the requested page.
composer.callbackQuery(/^dpg:(\d+)$/, async (ctx) => {
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
    await ctx.answerCallbackQuery({ text: "Nothing to delete here." });
    return;
  }

  await ctx.editMessageText(picker.text, { reply_markup: picker.keyboard });
  await ctx.answerCallbackQuery();
});

// Step 1: user picked a transaction → ask for confirmation.
composer.callbackQuery(/^del:(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  const kb = new InlineKeyboard()
    .text("✅ Yes, delete", `delok:${id}`)
    .text("✖ Cancel", "delx");

  await ctx.editMessageText("Delete this transaction? This can't be undone.", {
    reply_markup: kb,
  });
  await ctx.answerCallbackQuery();
});

// Step 2a: confirmed → delete.
composer.callbackQuery(/^delok:(.+)$/, async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) {
    await ctx.answerCallbackQuery();
    return;
  }

  const id = ctx.match[1];
  const res = await api.delete(telegramId, `/transactions/${id}`);

  let msg: string;
  if (res.status === 204) {
    msg = "✅ Deleted.";
  } else if (res.status === 403) {
    msg = "🔒 Monobank transactions are read-only.";
  } else if (res.status === 404) {
    msg = "Already gone.";
  } else {
    msg = "Failed to delete. Please try again.";
  }

  await ctx.editMessageText(msg);
  await ctx.answerCallbackQuery();
});

// Step 2b: cancelled.
composer.callbackQuery("delx", async (ctx) => {
  await ctx.editMessageText("Cancelled.");
  await ctx.answerCallbackQuery();
});

export { composer as deleteRouter };
