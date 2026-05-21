import { Composer } from "grammy";
import type { MyContext } from "../context.js";

const composer = new Composer<MyContext>();

composer.hears(/[+-]\d[\d,.]*\s+.+/, async (ctx) => {
  await ctx.conversation.enter("addTransactionConversation");
});

export { composer as transactionRouter };
