import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../context.js";
import { api } from "../services/apiClient.js";
import type { HistoryResponse, HistoryTransaction } from "./history.format.js";

const composer = new Composer<MyContext>();

function buttonLabel(tx: HistoryTransaction): string {
  const emoji = tx.type === "INCOME" ? "🟢" : "🔴";
  const sign = tx.type === "INCOME" ? "+" : "-";
  const n = typeof tx.amount === "number" ? tx.amount : parseFloat(tx.amount);
  const amount = Number.isFinite(n) ? n.toFixed(2) : "0.00";
  const date = tx.created_at.slice(0, 10);
  const title = tx.title || "—";
  return `${emoji} ${date} ${title} ${sign}${amount} ${tx.currencyCode}`;
}

composer.command("delete", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const res = await api.get(telegramId, "/transactions?page=1&perPage=10");
  if (!res.ok) {
    await ctx.reply("Failed to load transactions. Please try again.");
    return;
  }

  const data = (await res.json()) as HistoryResponse;

  // Monobank transactions are read-only — never list them in the picker.
  const deletable = (data.data ?? []).filter((tx) => tx.source !== "MONOBANK");
  if (deletable.length === 0) {
    await ctx.reply("📭 Nothing to delete.");
    return;
  }

  const kb = new InlineKeyboard();
  for (const tx of deletable) {
    kb.text(buttonLabel(tx), `del:${tx.id}`).row();
  }

  await ctx.reply("🗑 Pick a transaction to delete:", { reply_markup: kb });
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
