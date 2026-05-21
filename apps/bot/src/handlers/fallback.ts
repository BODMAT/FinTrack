import { Composer } from "grammy";
import type { MyContext } from "../context.js";

const composer = new Composer<MyContext>();

composer.on("message", async (ctx) => {
  await ctx.reply("I don't get it. 🥀");
});

export { composer as fallbackRouter };
