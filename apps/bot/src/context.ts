import type { Context } from "grammy";
import type { ConversationFlavor } from "@grammyjs/conversations";

// telegramId is guaranteed by telegramIdMiddleware: updates without a user id
// are dropped before reaching any handler.
export type MyContext = ConversationFlavor<Context> & {
  telegramId: number;
};
