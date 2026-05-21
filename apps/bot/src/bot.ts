import { Bot, GrammyError, HttpError } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { config } from "./config.js";
import type { MyContext } from "./context.js";
import { BotError } from "./utils/BotError.js";
import { authMiddleware } from "./middlewares/auth.js";
import { startRouter } from "./commands/start.js";
import { summaryRouter } from "./commands/summary.js";
import { registerCommands } from "./commands/register.js";
import { addTransactionConversation } from "./conversations/addTransaction.js";
import { transactionRouter } from "./handlers/transaction.js";
import { fallbackRouter } from "./handlers/fallback.js";

const bot = new Bot<MyContext>(config.BOT_TOKEN);

bot.use(conversations());
bot.use(createConversation(addTransactionConversation));
bot.use(authMiddleware);

bot.use(startRouter);
bot.use(summaryRouter);
bot.use(transactionRouter);
bot.use(fallbackRouter);

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
  const msg =
    e instanceof BotError
      ? e.userMessage
      : "⚠️ Something went wrong. Please try again.";
  ctx.reply(msg).catch(() => {});
});

registerCommands(bot);

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());

bot.start();
