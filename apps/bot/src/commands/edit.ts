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

composer.command("edit", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const res = await api.get(telegramId, "/transactions?page=1&perPage=10");
  if (!res.ok) {
    await ctx.reply("Failed to load transactions. Please try again.");
    return;
  }

  const data = (await res.json()) as HistoryResponse;

  // Monobank transactions are read-only — never list them in the picker.
  const editable = (data.data ?? []).filter((tx) => tx.source !== "MONOBANK");
  if (editable.length === 0) {
    await ctx.reply("📭 Nothing to edit.");
    return;
  }

  const kb = new InlineKeyboard();
  for (const tx of editable) {
    kb.text(buttonLabel(tx), `edit:${tx.id}`).row();
  }

  await ctx.reply("✏️ Pick a transaction to edit:", { reply_markup: kb });
});

// User picked a transaction → enter conversation to collect the new value.
composer.callbackQuery(/^edit:(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("editTransactionConversation", id);
});

export { composer as editRouter };
