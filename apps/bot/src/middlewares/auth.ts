import type { NextFunction } from "grammy";
import type { MyContext } from "../context.js";
import { authenticateUser, isAuthenticated } from "../services/apiClient.js";
import { BotError } from "../utils/BotError.js";

export async function authMiddleware(
  ctx: MyContext,
  next: NextFunction,
): Promise<void> {
  const telegramId = ctx.from?.id;
  const name = ctx.from?.first_name ?? "User";

  if (!telegramId) {
    await next();
    return;
  }

  if (!(await isAuthenticated(telegramId))) {
    try {
      await authenticateUser(telegramId, name);
    } catch {
      throw new BotError(
        "Auth failed",
        "❌ Auth failed. Please try again later.",
      );
    }
  }

  await next();
}
