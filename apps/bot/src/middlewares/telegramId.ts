import type { NextFunction } from "grammy";
import type { MyContext } from "../context.js";

// Drops updates without a user id and exposes ctx.telegramId to every handler,
// so handlers no longer repeat the `ctx.from?.id` guard.
export async function telegramIdMiddleware(
  ctx: MyContext,
  next: NextFunction,
): Promise<void> {
  const id = ctx.from?.id;
  if (!id) return;
  ctx.telegramId = id;
  await next();
}
