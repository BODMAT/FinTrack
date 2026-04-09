import { prisma } from "../../prisma/client.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { ErrorLogStatus, UserRole } from "@prisma/client";
import type { Prisma } from "@prisma/client";

type ListErrorLogsParams = {
  status?: ErrorLogStatus;
  limit: number;
  offset: number;
};

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      name: true,
      role: true,
      isVerified: true,
      created_at: true,
      updated_at: true,
      authMethods: {
        select: {
          type: true,
          email: true,
          telegram_id: true,
          google_sub: true,
        },
      },
    },
  });
}

export async function updateUserRole(
  actorAdminId: string,
  userId: string,
  role: UserRole,
) {
  if (actorAdminId === userId && role === "USER") {
    throw new AppError("You cannot revoke your own admin role", 400);
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      role: true,
      isVerified: true,
      created_at: true,
      updated_at: true,
    },
  });
}

export async function revokeUserSessions(userId: string) {
  const now = new Date();
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: now,
      lastUsedAt: now,
    },
  });

  return { revokedCount: result.count };
}

export async function revokeAllSessions(excludeSessionId?: string) {
  const now = new Date();
  const result = await prisma.session.updateMany({
    where: {
      revokedAt: null,
      ...(excludeSessionId ? { NOT: { sessionId: excludeSessionId } } : {}),
    },
    data: { revokedAt: now, lastUsedAt: now },
  });
  return { revokedCount: result.count };
}

export async function getAdminStats() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalAdmins,
    verifiedUsers,
    newUsersLast7Days,
    activeSessions,
    openErrorLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.user.count({ where: { created_at: { gte: sevenDaysAgo } } }),
    prisma.session.count({
      where: {
        revokedAt: null,
        expiresAt: { gt: now },
      },
    }),
    prisma.errorLog.count({ where: { status: "OPEN" } }),
  ]);

  return {
    users: {
      total: totalUsers,
      admins: totalAdmins,
      verified: verifiedUsers,
      newLast7Days: newUsersLast7Days,
    },
    sessions: {
      active: activeSessions,
    },
    errors: {
      open: openErrorLogs,
    },
    generatedAt: now,
  };
}

export async function reportErrorLog(params: {
  userId: string;
  title: string;
  message: string;
  stack?: string;
  source?: string;
  userAgent?: string;
  context?: Prisma.InputJsonValue;
}) {
  return prisma.errorLog.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      ...(params.stack !== undefined ? { stack: params.stack } : {}),
      ...(params.source !== undefined ? { source: params.source } : {}),
      ...(params.userAgent !== undefined
        ? { userAgent: params.userAgent }
        : {}),
      ...(params.context !== undefined ? { context: params.context } : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function listErrorLogs(params: ListErrorLogsParams) {
  const where = params.status ? { status: params.status } : {};

  return prisma.errorLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit,
    skip: params.offset,
    select: {
      id: true,
      title: true,
      message: true,
      stack: true,
      source: true,
      userAgent: true,
      status: true,
      resolutionNote: true,
      context: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      resolvedByAdmin: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function resolveErrorLog(params: {
  errorLogId: string;
  adminId: string;
  resolved: boolean;
  resolutionNote?: string;
}) {
  return prisma.errorLog.update({
    where: { id: params.errorLogId },
    data: params.resolved
      ? {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolvedByAdminId: params.adminId,
          resolutionNote: params.resolutionNote ?? null,
        }
      : {
          status: "OPEN",
          resolvedAt: null,
          resolvedByAdminId: null,
          resolutionNote: params.resolutionNote ?? null,
        },
    select: {
      id: true,
      status: true,
      resolvedAt: true,
      resolutionNote: true,
      resolvedByAdminId: true,
      updatedAt: true,
    },
  });
}
