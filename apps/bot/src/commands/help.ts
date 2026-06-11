import { Composer } from "grammy";
import type { MyContext } from "../context.js";

const composer = new Composer<MyContext>();

const HELP_TEXT = [
  "🤖 *FinTrack bot — how to use*",
  "",
  "*Commands:*",
  "/summary — balance, income & expenses",
  "/history — recent transactions",
  "/delete — delete a transaction",
  "/edit — edit a transaction",
  "/help — this message",
  "",
  "*Add a transaction:*",
  "Just send a message like:",
  "`+1500 salary` — income",
  "`-50 coffee` — expense",
  "",
  "After adding you can optionally share a location 📍",
].join("\n");

composer.command("help", async (ctx) => {
  await ctx.reply(HELP_TEXT, { parse_mode: "Markdown" });
});

export { composer as helpRouter };
