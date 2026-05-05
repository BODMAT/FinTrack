import type { NextFunction, Request, Response } from "express";
import { doubleCsrf } from "csrf-csrf";
import { ENV } from "../config/env.js";

const CSRF_BYPASS_PATHS = new Set([
  "/api/donations/webhook",
  "/api/auth/login",
  "/api/auth/google/exchange",
  "/api/auth/token",
  "/api/auth/logout",
  "/api/auth/logout-all",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
]);

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
    req.headers["x-csrf-token"] ?? undefined,
  skipCsrfProtection: (req: Request) =>
    ENV.NODE_ENV === "test" ||
    (ENV.NODE_ENV !== "production" && req.path.startsWith("/api-docs")) ||
    CSRF_BYPASS_PATHS.has(req.path),
});

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  doubleCsrfProtection(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
}
