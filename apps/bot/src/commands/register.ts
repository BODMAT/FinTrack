import { Bot } from "grammy";
import type { MyContext } from "../context.js";

export async function registerCommands(bot: Bot<MyContext>) {
  await bot.api.setMyCommands([
    { command: "start", description: "start chat with a bot" },
    { command: "summary", description: "summary of incomes/expenses" },
    { command: "help", description: "how to use this bot" },
  ]);
}
