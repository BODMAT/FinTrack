import { Composer } from "grammy";
import type { MyContext } from "../context.js";
import {
  buildTransactionPicker,
  type PickerConfig,
} from "../utils/transactionPicker.js";

const composer = new Composer<MyContext>();

const PICKER: PickerConfig = {
  itemPrefix: "edit",
  navPrefix: "epg",
  verb: "edit",
  emoji: "✏️",
};

composer.command("edit", async (ctx) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const picker = await buildTransactionPicker(telegramId, 1, PICKER);
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
  const picker = await buildTransactionPicker(telegramId, page, PICKER);
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
