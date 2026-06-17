import type { NextFunction, Request, Response } from "express";
import { doubleCsrf } from "csrf-csrf";
import { ENV } from "../config/env.js";
import { AppError } from "./errorHandler.js";

const CSRF_BYPASS_PATHS = new Set([
  "/api/donations/webhook",
  "/api/auth/login",
  "/api/auth/google/exchange",
  "/api/auth/telegram/exchange",
  "/api/auth/telegram/refresh",
  "/api/auth/token",
  "/api/auth/logout",
  "/api/auth/logout-all",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
]);

// CSRF (double-submit) only protects ambient-credential requests (browser
// cookies). Header-token clients — the Telegram bot sends `Authorization:
// Bearer` with no auth cookie — can't be forged cross-site, so CSRF is moot.
// Skipping them also avoids forcing a stateless API client through the
// cookie/token dance. The web app always sends the auth cookie, so it stays
// protected.
function isHeaderTokenClient(req: Request): boolean {
  const hasBearer =
    typeof req.headers.authorization === "string" &&
    req.headers.authorization.startsWith("Bearer ");
  const authCookie = req.cookies?.["fintrack_access_token"];
  const hasAuthCookie = typeof authCookie === "string" && authCookie.length > 0;
  return hasBearer && !hasAuthCookie;
}

export const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => ENV.CSRF_SECRET,
  getSessionIdentifier: (req: Request) => {
    const accessToken = req.cookies?.["fintrack_access_token"];
    if (typeof accessToken === "string" && accessToken.length > 0) {
      return accessToken;
    }

    return req.ip ?? "anonymous";
  },
  cookieName: "csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
    secure: ENV.NODE_ENV === "production",
    path: "/",
  },
  getCsrfTokenFromRequest: (req: Request) =>
    typeof req.headers["x-csrf-token"] === "string"
      ? req.headers["x-csrf-token"]
      : undefined,
  skipCsrfProtection: (req: Request) =>
    ENV.NODE_ENV === "test" ||
    (ENV.NODE_ENV !== "production" && req.path.startsWith("/api-docs")) ||
    CSRF_BYPASS_PATHS.has(req.path) ||
    isHeaderTokenClient(req),
});

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  doubleCsrfProtection(req, res, (err: unknown) => {
    if (err) {
      return next(
        new AppError("CSRF validation failed", 403, {
          code: "CSRF_INVALID",
          cause: err,
        }),
      );
    }
    next();
  });
}
