import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../context.js";
import { api } from "../services/apiClient.js";
import { parseTransaction } from "../utils/parseTransaction.js";
import { extractLocation, locationKeyboard } from "../utils/location.js";

export async function editTransactionConversation(
  conversation: Conversation<MyContext, MyContext>,
  ctx: MyContext,
  id: string,
) {
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

  await ctx.reply("Update location? (No keeps the current one)", {
    reply_markup: locationKeyboard(),
  });

  const locationMsg = await conversation.wait();
  // "No" / any non-location reply keeps the existing location: omit the field.
  const location = extractLocation(locationMsg);

  // conversation.external must return a serializable value for replay —
  // never a Response object. Read status inside, return a plain result.
  let res: { ok: boolean; status: number };
  try {
    res = await conversation.external(async () => {
      const r = await api.patch(telegramId, `/transactions/${id}`, {
        title: title || "Transaction",
        type,
        amount: absAmount,
        ...(location ? { location } : {}),
      });
      return { ok: r.ok, status: r.status };
    });
  } catch {
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
