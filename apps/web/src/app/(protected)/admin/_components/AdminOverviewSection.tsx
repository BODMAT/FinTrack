import type { AdminErrorLog, AdminStats, AdminUser } from "@fintrack/types";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { AdminInsightsCharts } from "./AdminInsightsCharts";

interface AdminOverviewSectionProps {
  stats?: AdminStats;
  users: AdminUser[];
  chartLogs: AdminErrorLog[];
  isStatsLoading: boolean;
  isChartsLoading: boolean;
}

export function AdminOverviewSection({
  stats,
  users,
  chartLogs,
  isStatsLoading,
  isChartsLoading,
}: AdminOverviewSectionProps) {
  const { t } = useSafeTranslation();

  const metrics = !stats
    ? []
    : [
        {
          id: "totalUsers",
          label: t("admin.metrics.totalUsers"),
          value: stats.users.total,
        },
        {
          id: "admins",
          label: t("admin.metrics.admins"),
          value: stats.users.admins,
        },
        {
          id: "verifiedUsers",
          label: t("admin.metrics.verifiedUsers"),
          value: stats.users.verified,
        },
        {
          id: "newUsers7d",
          label: t("admin.metrics.newUsers7d"),
          value: stats.users.newLast7Days,
        },
        {
          id: "activeSessions",
          label: t("admin.metrics.activeSessions"),
          value: stats.sessions.active,
        },
        {
          id: "openErrors",
          label: t("admin.metrics.openErrors"),
          value: stats.errors.open,
        },
      ];

  return (
    <>
      <div className="neo-panel p-[20px] max-[1100px]:p-[16px]">
        <h1 className="text-[28px] font-black tracking-[0.02em] text-(--color-title) max-[1100px]:text-[24px]">
          {t("admin.title")}
        </h1>
        <p className="mt-[8px] text-(--color-text) max-[1100px]:text-[14px]">
          {t("admin.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-[14px] max-[1280px]:grid-cols-2 max-[700px]:grid-cols-1">
        {isStatsLoading && (
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
        logs={chartLogs}
        isLoading={isChartsLoading}
      />
    </>
  );
}
