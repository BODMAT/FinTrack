import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../context.js";
import { api } from "../services/apiClient.js";
import { parseTransaction } from "../utils/parseTransaction.js";
import {
  extractLocationEdit,
  locationEditKeyboard,
} from "../utils/location.js";
import {
  currencyEditKeyboard,
  extractCurrencyEdit,
} from "../utils/currency.js";
import { callExternal } from "../utils/apiExternal.js";

export async function editTransactionConversation(
  conversation: Conversation<MyContext, MyContext>,
  ctx: MyContext,
  id: string,
) {
  // ctx.from.id, not ctx.telegramId: outer-middleware ctx props are lost on replay.
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  await ctx.reply("Send the new value like `+1500 salary` or `-50 coffee`:", {
    parse_mode: "Markdown",
  });

  const reply = await conversation.wait();
  const txt = reply.message?.text;
  if (!txt) {
    await ctx.reply("❌ Expected a text message. Cancelled.");
    return;
  }

  const parsed = parseTransaction(txt);
  if (!parsed) {
    await ctx.reply("❌ Couldn't read the amount. Cancelled.");
    return;
  }
  const { absAmount, title, type } = parsed;

  await ctx.reply("Choose currency or keep the current one:", {
    reply_markup: currencyEditKeyboard(),
  });

  const currencyMsg = await conversation.wait();
  const currencyCode = extractCurrencyEdit(currencyMsg);

  await ctx.reply(
    "Update location? Keep current, send a new one, or remove it.",
    {
      reply_markup: locationEditKeyboard(),
    },
  );

  const locationMsg = await conversation.wait();
  const location = extractLocationEdit(locationMsg);

  const res = await callExternal(conversation, () =>
    api.patch(telegramId, `/transactions/${id}`, {
      title: title || "Transaction",
      type,
      amount: absAmount,
      ...(currencyCode !== undefined ? { currencyCode } : {}),
      // undefined = keep (omit); null = remove; LatLng = set.
      ...(location !== undefined ? { location } : {}),
    }),
  );

  if ("error" in res) {
    await ctx.reply("❌ Network error. Try again.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }
  if (res.status === 403) {
    await ctx.reply("🔒 Monobank transactions are read-only.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }
  if (res.status === 404) {
    await ctx.reply("Transaction not found. It may have been deleted.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }
  if (!res.ok) {
    await ctx.reply("❌ Failed to update. Try again.", {
      reply_markup: { remove_keyboard: true },
    });
    return;
  }

  await ctx.reply("✅ Transaction updated!", {
    reply_markup: { remove_keyboard: true },
  });
}
