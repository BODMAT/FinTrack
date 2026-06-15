import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../context.js";
import { api } from "../services/apiClient.js";
import { parseTransaction } from "../utils/parseTransaction.js";
import { extractLocation, locationKeyboard } from "../utils/location.js";
import { callExternal } from "../utils/apiExternal.js";

export async function addTransactionConversation(
  conversation: Conversation<MyContext, MyContext>,
  ctx: MyContext,
) {
  // ctx.from.id, not ctx.telegramId: outer-middleware ctx props are lost on replay.
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const txt = ctx.message?.text;
  if (!txt) return;

  const parsed = parseTransaction(txt);
  if (!parsed) return;
  const { absAmount, title, type } = parsed;
  const typeLabel = type === "INCOME" ? "🟢 Income" : "🔴 Expense";

  await ctx.reply(
    `${typeLabel}: *${absAmount}*\nTitle: ${title || "—"}\n\nShare location?`,
    { reply_markup: locationKeyboard(), parse_mode: "Markdown" },
  );

  const locationMsg = await conversation.wait();
  const location = extractLocation(locationMsg);

  const res = await callExternal(conversation, () =>
    api.post(telegramId, "/transactions", {
      title: title || "Transaction",
      type,
      amount: absAmount,
      ...(location ? { location } : {}),
    }),
  );

  if ("error" in res) {
    await ctx.reply("❌ Network error. Try again.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }
  if (!res.ok) {
    await ctx.reply("❌ Failed to save. Try again.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  await ctx.reply("✅ Transaction saved!", {
    reply_markup: { remove_keyboard: true },
  });
}
