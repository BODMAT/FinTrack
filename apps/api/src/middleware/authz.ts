import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";
import { ENV } from "../config/env.js";

export function requireRole(allowedRoles: Array<"USER" | "ADMIN">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) return next(new AppError("Unauthorized", 401));
    if (!allowedRoles.includes(role)) {
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
