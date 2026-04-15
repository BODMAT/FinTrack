import type { NextFunction, Request, Response } from "express";
import { ENV } from "../config/env.js";
import { AppError } from "./errorHandler.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getRequestOrigin(req: Request): string | null {
  const origin = req.headers.origin;
  if (typeof origin === "string" && origin.length > 0) return origin;

  const referer = req.headers.referer;
  if (typeof referer !== "string" || referer.length === 0) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function csrfProtection(allowedOrigins: string[]) {
  const origins = new Set(allowedOrigins);

  return (req: Request, _res: Response, next: NextFunction) => {
    if (ENV.NODE_ENV !== "production") return next();
    if (req.path === "/donations/webhook") return next();
    if (SAFE_METHODS.has(req.method)) return next();

    const requestOrigin = getRequestOrigin(req);
    if (!requestOrigin || !origins.has(requestOrigin)) {
      return next(new AppError("CSRF validation failed", 403));
    }

    next();
  };
}
