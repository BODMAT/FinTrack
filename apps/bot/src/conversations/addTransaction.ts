import { Keyboard } from "grammy";
import type { Conversation } from "@grammyjs/conversations";
import type { MyContext } from "../context.js";
import { capitalizeFirstLetter } from "../utils/capitalize.js";
import { api } from "../services/apiClient.js";

export async function addTransactionConversation(
  conversation: Conversation<MyContext, MyContext>,
  ctx: MyContext,
) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const txt = ctx.message?.text;
  if (!txt) return;

  const parts = txt.trim().split(/\s+/);
  const rawAmount = parts[0] ?? "0";
  const amount = parseFloat(rawAmount.replace(",", "."));
  const title = capitalizeFirstLetter(parts.slice(1).join(" ") || "");
  const type: "INCOME" | "EXPENSE" = amount >= 0 ? "INCOME" : "EXPENSE";
  const absAmount = Math.abs(amount);
  const typeLabel = type === "INCOME" ? "🟢 Income" : "🔴 Expense";

  const keyboard = new Keyboard()
    .requestLocation("📍 Yes")
    .text("No")
    .resized();

  await ctx.reply(
    `${typeLabel}: *${absAmount}*\nTitle: ${title || "—"}\n\nShare location?`,
    { reply_markup: keyboard, parse_mode: "Markdown" },
  );

  const locationMsg = await conversation.wait();

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
      const r = await api.post(telegramId, "/transactions", {
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
