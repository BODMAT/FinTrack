import { Bot, GrammyError, HttpError } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { config } from "./config.js";
import type { MyContext } from "./context.js";
import { BotError } from "./utils/BotError.js";
import { authMiddleware } from "./middlewares/auth.js";
import { startRouter } from "./commands/start.js";
import { summaryRouter } from "./commands/summary.js";
import { historyRouter } from "./commands/history.js";
import { helpRouter } from "./commands/help.js";
import { deleteRouter } from "./commands/delete.js";
import { editRouter } from "./commands/edit.js";
import { registerCommands } from "./commands/register.js";
import { addTransactionConversation } from "./conversations/addTransaction.js";
import { editTransactionConversation } from "./conversations/editTransaction.js";
import { transactionRouter } from "./handlers/transaction.js";
import { fallbackRouter } from "./handlers/fallback.js";
import { redis } from "./lib/redis.js";
import { logger } from "./lib/logger.js";

const bot = new Bot<MyContext>(config.TELEGRAM_BOT_TOKEN);

bot.use(conversations());
bot.use(createConversation(addTransactionConversation));
bot.use(createConversation(editTransactionConversation));
bot.use(authMiddleware);

bot.use(startRouter);
bot.use(summaryRouter);
bot.use(historyRouter);
bot.use(helpRouter);
bot.use(deleteRouter);
bot.use(editRouter);
bot.use(transactionRouter);
bot.use(fallbackRouter);

bot.catch((err) => {
  const ctx = err.ctx;
  logger.error(
    { updateId: ctx.update.update_id },
    "Error while handling update",
  );
  const e = err.error;
  if (e instanceof GrammyError) {
    logger.error({ description: e.description }, "Error in request");
  } else if (e instanceof HttpError) {
    logger.error({ err: e }, "Could not contact Telegram");
  } else {
    logger.error({ err: e }, "Unknown error");
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

async function main() {
  await redis.connect();
  logger.info("Redis connected");
  bot.start();
}

main().catch((err) => {
  logger.error({ err }, "Bot startup failed");
  process.exit(1);
});
