import { Keyboard } from "grammy";
import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../context.js";
import { capitalizeFirstLetter } from "../utils/capitalize.js";
import { api } from "../services/apiClient.js";

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

  const parts = txt.trim().split(/\s+/);
  const rawAmount = parts[0] ?? "";
  const amount = parseFloat(rawAmount.replace(",", "."));
  if (!Number.isFinite(amount)) {
    await ctx.reply("❌ Couldn't read the amount. Cancelled.");
    return;
  }

  const title = capitalizeFirstLetter(parts.slice(1).join(" ") || "");
  const type: "INCOME" | "EXPENSE" = amount >= 0 ? "INCOME" : "EXPENSE";
  const absAmount = Math.abs(amount);

  const keyboard = new Keyboard()
    .requestLocation("📍 Yes")
    .text("No")
    .resized();

  await ctx.reply("Update location? (No keeps the current one)", {
    reply_markup: keyboard,
  });

  const locationMsg = await conversation.wait();

  // "No" / any non-location reply keeps the existing location: omit the field.
  let location: { latitude: number; longitude: number } | undefined;
  if (locationMsg.message?.location) {
    location = {
      latitude: locationMsg.message.location.latitude,
      longitude: locationMsg.message.location.longitude,
    };
  }

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
