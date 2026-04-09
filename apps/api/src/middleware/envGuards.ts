import type { NextFunction, Request, Response } from "express";
import { ENV } from "../config/env.js";
import { AppError } from "./errorHandler.js";

export function blockInProduction(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (ENV.NODE_ENV === "production") {
    return next(new AppError("Not found", 404));
  }
  next();
}
