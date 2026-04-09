import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";
import { ENV } from "../config/env.js";
import { prisma } from "../prisma/client.js";

export function requireRole(allowedRoles: Array<"USER" | "ADMIN">) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const authUser = req.user;
    const userId = authUser?.id;
    if (!userId || !authUser) return next(new AppError("Unauthorized", 401));

    let effectiveRole: "USER" | "ADMIN" = authUser.role;
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user) {
        // Keep req.user role in sync with DB role for downstream handlers.
        authUser.role = user.role;
        effectiveRole = user.role;
      }
    } catch {
      // If DB is temporarily unavailable, fall back to token role.
      effectiveRole = authUser.role;
    }

    if (!allowedRoles.includes(effectiveRole)) {
      return next(new AppError("Forbidden", 403));
    }
    next();
  };
}

export function requireVerifiedUser(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!req.user) return next(new AppError("Unauthorized", 401));
  if (ENV.NODE_ENV !== "production") return next();
  if (!req.user.isVerified) {
    return next(new AppError("Email verification required", 403));
  }
  next();
}
