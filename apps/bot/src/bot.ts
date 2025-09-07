import dotenv from "dotenv";
import { Bot, GrammyError, HttpError } from "grammy";

dotenv.config();

const BOT_API_KEY = process.env.BOT_API_KEY || undefined;

if (!BOT_API_KEY) {
	throw new Error("BOT_API_KEY is required in .env");
}

export const bot = new Bot(BOT_API_KEY);

bot.api.setMyCommands([
	{
		command: "start",
		description: "start chat with a bot"
	}
]);

bot.command("start", async (ctx) => {
	await ctx.reply("Hi! I'm your FinTrack bot 🚀");
});

bot.on("message", async (ctx) => {
	await ctx.reply("I don't get it.");
});

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
});

bot.start();


