"use client";

import { useMemo, useState } from "react";
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
import type { AdminUser, ErrorLogStatus } from "@fintrack/types";
import { AdminInsightsCharts } from "./AdminInsightsCharts";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getPreferredUserContact(user: AdminUser) {
  const emailMethod = user.authMethods.find((item) => item.type === "EMAIL");
  if (emailMethod?.email) return emailMethod.email;

  const telegramMethod = user.authMethods.find(
    (item) => item.type === "TELEGRAM",
  );
  if (telegramMethod?.telegram_id) return `tg:${telegramMethod.telegram_id}`;

  const googleMethod = user.authMethods.find((item) => item.type === "GOOGLE");
  if (googleMethod?.google_sub) return `google:${googleMethod.google_sub}`;

  return "-";
}

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

  const metrics = useMemo(() => {
    if (!statsQuery.data) return [];

    return [
      {
        id: "totalUsers",
        label: t("admin.metrics.totalUsers"),
        value: statsQuery.data.users.total,
      },
      {
        id: "admins",
        label: t("admin.metrics.admins"),
        value: statsQuery.data.users.admins,
      },
      {
        id: "verifiedUsers",
        label: t("admin.metrics.verifiedUsers"),
        value: statsQuery.data.users.verified,
      },
      {
        id: "newUsers7d",
        label: t("admin.metrics.newUsers7d"),
        value: statsQuery.data.users.newLast7Days,
      },
      {
        id: "activeSessions",
        label: t("admin.metrics.activeSessions"),
        value: statsQuery.data.sessions.active,
      },
      {
        id: "openErrors",
        label: t("admin.metrics.openErrors"),
        value: statsQuery.data.errors.open,
      },
    ];
  }, [statsQuery.data, t]);

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
      <div className="neo-panel p-[20px] max-[1100px]:p-[16px]">
        <h1 className="text-[28px] font-black tracking-[0.02em] text-(--color-title) max-[1100px]:text-[24px]">
          {t("admin.title")}
        </h1>
        <p className="mt-[8px] text-(--color-text) max-[1100px]:text-[14px]">
          {t("admin.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-[14px] max-[1280px]:grid-cols-2 max-[700px]:grid-cols-1">
        {statsQuery.isLoading && (
          <div className="neo-panel col-span-full p-[16px]">
            {t("admin.loadingStats")}
          </div>
        )}
        {metrics.map((metric) => (
          <div key={metric.id} className="neo-panel p-[16px]">
            <p className="text-[13px] uppercase tracking-[0.08em] text-(--color-fixed-text)">
              {metric.label}
            </p>
            <p className="mt-[10px] text-[30px] leading-none font-black text-(--color-title)">
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <AdminInsightsCharts
        users={users}
        logs={chartLogsQuery.data ?? []}
        isLoading={usersQuery.isLoading || chartLogsQuery.isLoading}
      />

      <div className="neo-panel p-[20px] max-[1100px]:p-[16px]">
        <div className="mb-[16px] flex flex-wrap items-center justify-between gap-[12px]">
          <h2 className="text-[22px] font-bold text-(--color-title)">
            {t("admin.users.title")}
          </h2>
          <button
            type="button"
            onClick={() => revokeAllSessionsMutation.mutate()}
            disabled={revokeAllSessionsMutation.isPending}
            className="cursor-pointer rounded-[10px] border border-(--color-fixed-text) px-[14px] py-[8px] text-[14px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
          >
            {revokeAllSessionsMutation.isPending
              ? t("admin.users.loggingOutAll")
              : t("admin.users.logoutAllSessions")}
          </button>
        </div>

        {usersQuery.isLoading && (
          <p className="text-(--color-text)">{t("admin.users.loading")}</p>
        )}
        {usersQuery.isError && (
          <p className="text-(--text-red)">
            {(usersQuery.error as Error).message || t("admin.users.loadError")}
          </p>
        )}

        {!usersQuery.isLoading && !users.length && (
          <p className="text-(--color-text)">{t("admin.users.empty")}</p>
        )}

        {!!users.length && (
          <div className="overflow-x-auto max-[1100px]:hidden">
            <table className="w-full min-w-[840px] border-collapse text-left text-[14px]">
              <thead>
                <tr className="border-b border-(--stroke-soft) text-(--color-fixed-text)">
                  <th className="px-[8px] py-[10px]">
                    {t("admin.users.columns.name")}
                  </th>
                  <th className="px-[8px] py-[10px]">
                    {t("admin.users.columns.contact")}
                  </th>
                  <th className="px-[8px] py-[10px]">
                    {t("admin.users.columns.role")}
                  </th>
                  <th className="px-[8px] py-[10px]">
                    {t("admin.users.columns.verified")}
                  </th>
                  <th className="px-[8px] py-[10px]">
                    {t("admin.users.columns.created")}
                  </th>
                  <th className="px-[8px] py-[10px]">
                    {t("admin.users.columns.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((adminUser) => {
                  const canDemote =
                    adminUser.role === "ADMIN" && adminUser.id !== selfUserId;

                  return (
                    <tr
                      key={adminUser.id}
                      className="border-b border-(--stroke-soft) align-top"
                    >
                      <td className="px-[8px] py-[12px] text-(--color-title)">
                        {adminUser.name}
                      </td>
                      <td className="px-[8px] py-[12px] text-(--color-text)">
                        {getPreferredUserContact(adminUser)}
                      </td>
                      <td className="px-[8px] py-[12px] text-(--color-text)">
                        {adminUser.role}
                      </td>
                      <td className="px-[8px] py-[12px] text-(--color-text)">
                        {adminUser.isVerified
                          ? t("admin.users.yes")
                          : t("admin.users.no")}
                      </td>
                      <td className="px-[8px] py-[12px] text-(--color-text)">
                        {formatDate(adminUser.created_at)}
                      </td>
                      <td className="px-[8px] py-[12px]">
                        <div className="flex flex-wrap gap-[8px]">
                          {adminUser.role === "USER" && (
                            <button
                              type="button"
                              onClick={() =>
                                roleMutation.mutate({
                                  userId: adminUser.id,
                                  role: "ADMIN",
                                })
                              }
                              disabled={
                                roleMutation.isPending &&
                                roleChangingUserId === adminUser.id
                              }
                              className="cursor-pointer rounded-[8px] border border-(--color-fixed-text) px-[10px] py-[6px] text-[12px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {t("admin.users.makeAdmin")}
                            </button>
                          )}

                          {canDemote && (
                            <button
                              type="button"
                              onClick={() =>
                                roleMutation.mutate({
                                  userId: adminUser.id,
                                  role: "USER",
                                })
                              }
                              disabled={
                                roleMutation.isPending &&
                                roleChangingUserId === adminUser.id
                              }
                              className="cursor-pointer rounded-[8px] border border-(--text-red) px-[10px] py-[6px] text-[12px] font-semibold text-(--text-red) transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {t("admin.users.removeAdmin")}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              revokeUserSessionsMutation.mutate(adminUser.id)
                            }
                            disabled={
                              revokeUserSessionsMutation.isPending &&
                              sessionRevokingUserId === adminUser.id
                            }
                            className="cursor-pointer rounded-[8px] border border-(--color-fixed-text) px-[10px] py-[6px] text-[12px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {t("admin.users.logoutUser")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!!users.length && (
          <div className="hidden space-y-[12px] max-[1100px]:block">
            {users.map((adminUser) => {
              const canDemote =
                adminUser.role === "ADMIN" && adminUser.id !== selfUserId;

              return (
                <article
                  key={adminUser.id}
                  className="rounded-[12px] border border-(--stroke-soft) p-[12px]"
                >
                  <div className="flex items-start justify-between gap-[10px]">
                    <div className="min-w-0 flex-1">
                      <div className="max-w-full overflow-x-auto pb-[2px]">
                        <h3 className="w-max min-w-full whitespace-nowrap text-[16px] font-semibold text-(--color-title)">
                          {adminUser.name}
                        </h3>
                      </div>
                      <div className="mt-[4px] max-w-full overflow-x-auto pb-[2px]">
                        <p className="w-max min-w-full whitespace-nowrap text-[13px] text-(--color-text)">
                          {getPreferredUserContact(adminUser)}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-[999px] border border-(--stroke-soft) px-[8px] py-[3px] text-[11px] font-bold text-(--color-fixed-text)">
                      {adminUser.role}
                    </span>
                  </div>

                  <div className="mt-[10px] grid grid-cols-2 gap-[8px] text-[12px] text-(--color-fixed-text) max-[560px]:grid-cols-1">
                    <span>
                      {t("admin.users.columns.verified")}:{" "}
                      {adminUser.isVerified
                        ? t("admin.users.yes")
                        : t("admin.users.no")}
                    </span>
                    <span>
                      {t("admin.users.columns.created")}:{" "}
                      {formatDate(adminUser.created_at)}
                    </span>
                  </div>

                  <div className="mt-[12px] flex flex-wrap gap-[8px]">
                    {adminUser.role === "USER" && (
                      <button
                        type="button"
                        onClick={() =>
                          roleMutation.mutate({
                            userId: adminUser.id,
                            role: "ADMIN",
                          })
                        }
                        disabled={
                          roleMutation.isPending &&
                          roleChangingUserId === adminUser.id
                        }
                        className="cursor-pointer rounded-[8px] border border-(--color-fixed-text) px-[10px] py-[6px] text-[12px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("admin.users.makeAdmin")}
                      </button>
                    )}

                    {canDemote && (
                      <button
                        type="button"
                        onClick={() =>
                          roleMutation.mutate({
                            userId: adminUser.id,
                            role: "USER",
                          })
                        }
                        disabled={
                          roleMutation.isPending &&
                          roleChangingUserId === adminUser.id
                        }
                        className="cursor-pointer rounded-[8px] border border-(--text-red) px-[10px] py-[6px] text-[12px] font-semibold text-(--text-red) transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("admin.users.removeAdmin")}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        revokeUserSessionsMutation.mutate(adminUser.id)
                      }
                      disabled={
                        revokeUserSessionsMutation.isPending &&
                        sessionRevokingUserId === adminUser.id
                      }
                      className="cursor-pointer rounded-[8px] border border-(--color-fixed-text) px-[10px] py-[6px] text-[12px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t("admin.users.logoutUser")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="neo-panel p-[20px] max-[1100px]:p-[16px]">
        <div className="mb-[16px] flex flex-wrap items-center justify-between gap-[12px]">
          <h2 className="text-[22px] font-bold text-(--color-title)">
            {t("admin.errors.title")}
          </h2>
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => setLogStatusFilter("OPEN")}
              className={`cursor-pointer rounded-[8px] border px-[10px] py-[6px] text-[12px] font-semibold transition ${
                logStatusFilter === "OPEN"
                  ? "border-(--color-hover) text-(--color-hover)"
                  : "border-(--color-fixed-text) text-(--color-text)"
              }`}
            >
              {t("admin.errors.open")}
            </button>
            <button
              type="button"
              onClick={() => setLogStatusFilter("RESOLVED")}
              className={`cursor-pointer rounded-[8px] border px-[10px] py-[6px] text-[12px] font-semibold transition ${
                logStatusFilter === "RESOLVED"
                  ? "border-(--color-hover) text-(--color-hover)"
                  : "border-(--color-fixed-text) text-(--color-text)"
              }`}
            >
              {t("admin.errors.resolved")}
            </button>
            <button
              type="button"
              onClick={() => setLogStatusFilter("ALL")}
              className={`cursor-pointer rounded-[8px] border px-[10px] py-[6px] text-[12px] font-semibold transition ${
                logStatusFilter === "ALL"
                  ? "border-(--color-hover) text-(--color-hover)"
                  : "border-(--color-fixed-text) text-(--color-text)"
              }`}
            >
              {t("admin.errors.all")}
            </button>
          </div>
        </div>

        {errorLogsQuery.isLoading && (
          <p className="text-(--color-text)">{t("admin.errors.loading")}</p>
        )}
        {errorLogsQuery.isError && (
          <p className="text-(--text-red)">
            {(errorLogsQuery.error as Error).message ||
              t("admin.errors.loadError")}
          </p>
        )}

        {!errorLogsQuery.isLoading && !errorLogs.length && (
          <p className="text-(--color-text)">{t("admin.errors.empty")}</p>
        )}

        {!!errorLogs.length && (
          <div className="space-y-[12px]">
            {errorLogs.map((log) => (
              <article
                key={log.id}
                className="rounded-[12px] border border-(--stroke-soft) p-[14px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-[10px]">
                  <div>
                    <h3 className="text-[17px] font-semibold text-(--color-title)">
                      {log.title}
                    </h3>
                    <p className="mt-[4px] text-[12px] text-(--color-fixed-text)">
                      {log.user.name} ({log.user.role}) |{" "}
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`rounded-[999px] border px-[8px] py-[4px] text-[11px] font-bold ${
                      log.status === "OPEN"
                        ? "border-(--text-red) text-(--text-red)"
                        : "border-(--text-green) text-(--text-green)"
                    }`}
                  >
                    {log.status}
                  </span>
                </div>

                <p className="mt-[10px] whitespace-pre-wrap text-[14px] text-(--color-text)">
                  {log.message}
                </p>

                {log.stack && (
                  <pre className="mt-[10px] max-h-[180px] overflow-auto rounded-[8px] border border-(--stroke-soft) bg-black/20 p-[8px] text-[12px] text-(--color-fixed-text)">
                    {log.stack}
                  </pre>
                )}

                <div className="mt-[12px] flex flex-wrap items-center gap-[8px] text-[12px] text-(--color-fixed-text)">
                  <span>
                    {t("admin.errors.source")}: {log.source || "-"}
                  </span>
                  <span>|</span>
                  <span>
                    {t("admin.errors.userAgent")}: {log.userAgent || "-"}
                  </span>
                  <span>|</span>
                  <span>
                    {t("admin.errors.resolvedAt")}:{" "}
                    {log.resolvedAt ? formatDate(log.resolvedAt) : "-"}
                  </span>
                </div>

                <div className="mt-[12px] flex flex-wrap gap-[8px]">
                  <button
                    type="button"
                    onClick={() =>
                      resolveLogMutation.mutate({
                        errorLogId: log.id,
                        resolved: log.status !== "RESOLVED",
                      })
                    }
                    disabled={
                      resolveLogMutation.isPending && resolvingLogId === log.id
                    }
                    className="cursor-pointer rounded-[8px] border border-(--color-fixed-text) px-[10px] py-[6px] text-[12px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover) disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {log.status === "RESOLVED"
                      ? t("admin.errors.markOpen")
                      : t("admin.errors.markResolved")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
