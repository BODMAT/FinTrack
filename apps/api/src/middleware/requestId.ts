import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { runWithRequestContext } from "../lib/requestContext.js";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestId =
    (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
  res.setHeader("X-Request-Id", requestId);
  runWithRequestContext(requestId, () => next());
}
