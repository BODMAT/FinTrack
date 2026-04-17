"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminErrorLogs,
  getAdminStats,
  getAdminUsers,
  resolveAdminErrorLog,
  revokeSessionsForAll,
  revokeSessionsForUser,
  updateAdminUserRole,
} from "@/api/admin";
import { useAuth } from "@/hooks/useAuth";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import type { ErrorLogStatus } from "@fintrack/types";
import { AdminUsersSection } from "./AdminUsersSection";
import { AdminErrorLogsSection } from "./AdminErrorLogsSection";
import { AdminOverviewSection } from "./AdminOverviewSection";

export function AdminPanel() {
  const { t } = useSafeTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [logStatusFilter, setLogStatusFilter] = useState<
    "ALL" | ErrorLogStatus
  >("OPEN");

  const isAdmin = user?.role === "ADMIN";

  const statsQuery = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
    enabled: isAdmin,
  });

  const errorLogsQuery = useQuery({
    queryKey: ["admin", "error-logs", logStatusFilter],
    queryFn: () =>
      getAdminErrorLogs({
        limit: 50,
        ...(logStatusFilter !== "ALL" ? { status: logStatusFilter } : {}),
      }),
    enabled: isAdmin,
  });

  const chartLogsQuery = useQuery({
    queryKey: ["admin", "error-logs", "chart"],
    queryFn: () =>
      getAdminErrorLogs({
        limit: 100,
      }),
    enabled: isAdmin,
  });

  const roleMutation = useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: "USER" | "ADMIN";
    }) => updateAdminUserRole(userId, role),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
      ]);
    },
  });

  const revokeUserSessionsMutation = useMutation({
    mutationFn: (targetUserId: string) => revokeSessionsForUser(targetUserId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: revokeSessionsForAll,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  const resolveLogMutation = useMutation({
    mutationFn: ({
      errorLogId,
      resolved,
    }: {
      errorLogId: string;
      resolved: boolean;
    }) => resolveAdminErrorLog(errorLogId, { resolved }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin", "error-logs", logStatusFilter],
        }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
      ]);
    },
  });

  const roleChangingUserId = roleMutation.variables?.userId;
  const sessionRevokingUserId = revokeUserSessionsMutation.variables;
  const resolvingLogId = resolveLogMutation.variables?.errorLogId;

  const users = usersQuery.data ?? [];
  const errorLogs = errorLogsQuery.data ?? [];

  const selfUserId = user?.id;

  if (!isAdmin) {
    return (
      <section className="neo-panel p-[20px]">
        <h1 className="text-[28px] font-black tracking-[0.02em] text-(--color-title)">
          {t("admin.title")}
        </h1>
        <p className="mt-[12px] text-(--color-text)">
          {t("admin.accessDenied")}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-[20px] max-[1100px]:space-y-[16px]">
      <AdminOverviewSection
        stats={statsQuery.data}
        users={users}
        chartLogs={chartLogsQuery.data ?? []}
        isStatsLoading={statsQuery.isLoading}
        isChartsLoading={usersQuery.isLoading || chartLogsQuery.isLoading}
      />

      <AdminUsersSection
        users={users}
        selfUserId={selfUserId}
        isLoading={usersQuery.isLoading}
        errorMessage={
          usersQuery.isError
            ? (usersQuery.error as Error).message || t("admin.users.loadError")
            : undefined
        }
        isRevokingAll={revokeAllSessionsMutation.isPending}
        onRevokeAll={() => revokeAllSessionsMutation.mutate()}
        onPromote={(userId) => roleMutation.mutate({ userId, role: "ADMIN" })}
        onDemote={(userId) => roleMutation.mutate({ userId, role: "USER" })}
        onRevokeUserSessions={(userId) =>
          revokeUserSessionsMutation.mutate(userId)
        }
        isRolePendingForUser={(userId) =>
          roleMutation.isPending && roleChangingUserId === userId
        }
        isSessionPendingForUser={(userId) =>
          revokeUserSessionsMutation.isPending &&
          sessionRevokingUserId === userId
        }
      />

      <AdminErrorLogsSection
        logStatusFilter={logStatusFilter}
        setLogStatusFilter={setLogStatusFilter}
        errorLogs={errorLogs}
        isLoading={errorLogsQuery.isLoading}
        errorMessage={
          errorLogsQuery.isError
            ? (errorLogsQuery.error as Error).message ||
              t("admin.errors.loadError")
            : undefined
        }
        onToggleResolved={(errorLogId, resolved) =>
          resolveLogMutation.mutate({ errorLogId, resolved })
        }
        isResolvePendingForLog={(errorLogId) =>
          resolveLogMutation.isPending && resolvingLogId === errorLogId
        }
      />
    </section>
  );
}
