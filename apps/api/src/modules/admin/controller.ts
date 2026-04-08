import type { NextFunction, Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  AdminListErrorLogsQuerySchema,
  ReportErrorLogBodySchema,
  ResolveErrorLogBodySchema,
  UpdateUserRoleBodySchema,
} from "@fintrack/types";
import * as adminService from "./service.js";
import { AppError } from "../../middleware/errorHandler.js";

const UserIdParamSchema = z.object({
  userId: z.string().uuid(),
});

const ErrorLogIdParamSchema = z.object({
  errorLogId: z.string().uuid(),
});

export async function getUsers(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const users = await adminService.listUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

export async function setUserRole(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const actorAdminId = req.user?.id;
    if (!actorAdminId) throw new AppError("Unauthorized", 401);

    const { userId } = UserIdParamSchema.parse(req.params);
    const { role } = UpdateUserRoleBodySchema.parse(req.body);
    const user = await adminService.updateUserRole(actorAdminId, userId, role);

    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

export async function revokeSessionsForUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { userId } = UserIdParamSchema.parse(req.params);
    const result = await adminService.revokeUserSessions(userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function revokeSessionsForAllUsers(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const adminSessionId = _req.user?.sessionId;
    const result = await adminService.revokeAllSessions(adminSessionId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getStats(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const stats = await adminService.getAdminStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

export async function createErrorLog(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError("Unauthorized", 401);

    const body = ReportErrorLogBodySchema.parse(req.body);
    const userAgent = req.headers["user-agent"]?.slice(0, 512);
    const created = await adminService.reportErrorLog({
      userId,
      title: body.title,
      message: body.message,
      ...(body.stack !== undefined ? { stack: body.stack } : {}),
      ...(body.source !== undefined ? { source: body.source } : {}),
      ...(body.context !== undefined
        ? { context: body.context as Prisma.InputJsonValue }
        : {}),
      ...(userAgent !== undefined ? { userAgent } : {}),
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function getErrorLogs(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const query = AdminListErrorLogsQuerySchema.parse(req.query);
    const logs = await adminService.listErrorLogs({
      limit: query.limit,
      offset: query.offset,
      ...(query.status !== undefined ? { status: query.status } : {}),
    });
    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
}

export async function markErrorLogResolved(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const adminId = req.user?.id;
    if (!adminId) throw new AppError("Unauthorized", 401);

    const { errorLogId } = ErrorLogIdParamSchema.parse(req.params);
    const body = ResolveErrorLogBodySchema.parse(req.body);

    const result = await adminService.resolveErrorLog({
      errorLogId,
      adminId,
      resolved: body.resolved,
      ...(body.resolutionNote !== undefined
        ? { resolutionNote: body.resolutionNote }
        : {}),
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
