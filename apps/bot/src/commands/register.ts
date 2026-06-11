import { Bot } from "grammy";
import type { MyContext } from "../context.js";

export async function registerCommands(bot: Bot<MyContext>) {
  await bot.api.setMyCommands([
    { command: "start", description: "start chat with a bot" },
    { command: "summary", description: "summary of incomes/expenses" },
    { command: "history", description: "recent transactions" },
    { command: "delete", description: "delete a transaction" },
    { command: "edit", description: "edit a transaction" },
    { command: "help", description: "how to use this bot" },
  ]);
}
