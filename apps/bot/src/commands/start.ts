import { Composer } from "grammy";
import type { MyContext } from "../context.js";

const composer = new Composer<MyContext>();

composer.command("start", async (ctx) => {
  await ctx.reply("Hi! I'm your FinTrack bot. 🚀");
});

export { composer as startRouter };
