import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../context.js";
import { api } from "../services/apiClient.js";
import {
  buildTransactionPicker,
  type PickerConfig,
} from "../utils/transactionPicker.js";

const composer = new Composer<MyContext>();

const PICKER: PickerConfig = {
  itemPrefix: "del",
  navPrefix: "dpg",
  verb: "delete",
  emoji: "🗑",
};

composer.command("delete", async (ctx) => {
  const picker = await buildTransactionPicker(ctx.telegramId, 1, PICKER);
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

composer.callbackQuery(/^dpg:(\d+)$/, async (ctx) => {
  const page = Number(ctx.match[1]);
  const picker = await buildTransactionPicker(ctx.telegramId, page, PICKER);
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

// Picked a transaction → confirm before deleting (irreversible).
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

composer.callbackQuery(/^delok:(.+)$/, async (ctx) => {
  const id = ctx.match[1];
  const res = await api.delete(ctx.telegramId, `/transactions/${id}`);

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

composer.callbackQuery("delx", async (ctx) => {
  await ctx.editMessageText("Cancelled.");
  await ctx.answerCallbackQuery();
});

export { composer as deleteRouter };
