"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  ArcElement,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useMemo } from "react";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import type { AdminErrorLog, AdminUser } from "@fintrack/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
);

function getLastDaysLabels(days: number): string[] {
  const now = new Date();
  const labels: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    labels.push(
      date.toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
      }),
    );
  }
  return labels;
}

function toDayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function AdminInsightsCharts({
  users,
  logs,
  isLoading,
}: {
  users: AdminUser[];
  logs: AdminErrorLog[];
  isLoading: boolean;
}) {
  const { t } = useSafeTranslation();

  const roleChart = useMemo<ChartData<"doughnut">>(() => {
    const admins = users.filter((item) => item.role === "ADMIN").length;
    const regular = users.length - admins;
    return {
      labels: [t("admin.charts.admins"), t("admin.charts.users")],
      datasets: [
        {
          data: [admins, regular],
          backgroundColor: [
            "rgba(92, 132, 255, 0.85)",
            "rgba(33, 171, 130, 0.85)",
          ],
          borderColor: ["rgba(92, 132, 255, 1)", "rgba(33, 171, 130, 1)"],
          borderWidth: 1,
        },
      ],
    };
  }, [t, users]);

  const verificationChart = useMemo<ChartData<"doughnut">>(() => {
    const verified = users.filter((item) => item.isVerified).length;
    const unverified = users.length - verified;
    return {
      labels: [t("admin.charts.verified"), t("admin.charts.unverified")],
      datasets: [
        {
          data: [verified, unverified],
          backgroundColor: [
            "rgba(33, 171, 130, 0.85)",
            "rgba(224, 82, 103, 0.85)",
          ],
          borderColor: ["rgba(33, 171, 130, 1)", "rgba(224, 82, 103, 1)"],
          borderWidth: 1,
        },
      ],
    };
  }, [t, users]);

  const activityBar = useMemo<ChartData<"bar">>(() => {
    const days = 14;
    const labels = getLastDaysLabels(days);
    const now = new Date();

    const dayKeys = labels.map((_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (days - 1 - index));
      date.setHours(0, 0, 0, 0);
      return toDayKey(date);
    });

    const registrationByDay = new Map<string, number>();
    const errorsByDay = new Map<string, number>();

    for (const user of users) {
      const key = toDayKey(new Date(user.created_at));
      registrationByDay.set(key, (registrationByDay.get(key) ?? 0) + 1);
    }

    for (const log of logs) {
      const key = toDayKey(new Date(log.createdAt));
      errorsByDay.set(key, (errorsByDay.get(key) ?? 0) + 1);
    }

    return {
      labels,
      datasets: [
        {
          label: t("admin.charts.newUsers"),
          data: dayKeys.map((key) => registrationByDay.get(key) ?? 0),
          backgroundColor: "rgba(33, 171, 130, 0.7)",
          borderColor: "rgba(33, 171, 130, 1)",
          borderWidth: 1,
        },
        {
          label: t("admin.charts.newErrors"),
          data: dayKeys.map((key) => errorsByDay.get(key) ?? 0),
          backgroundColor: "rgba(224, 82, 103, 0.7)",
          borderColor: "rgba(224, 82, 103, 1)",
          borderWidth: 1,
        },
      ],
    };
  }, [logs, t, users]);

  return (
    <section className="neo-panel p-[20px] max-[1100px]:p-[16px]">
      <h2 className="text-[22px] font-bold text-(--color-title)">
        {t("admin.charts.title")}
      </h2>
      <p className="mt-[4px] text-[13px] text-(--color-fixed-text)">
        {t("admin.charts.subtitle")}
      </p>

      {isLoading ? (
        <p className="mt-[12px] text-(--color-text)">
          {t("admin.charts.loading")}
        </p>
      ) : (
        <div className="mt-[14px] grid grid-cols-2 gap-[16px] max-[1200px]:grid-cols-1">
          <div className="rounded-[12px] border border-(--stroke-soft) p-[12px]">
            <p className="mb-[10px] text-[13px] font-semibold text-(--color-fixed-text)">
              {t("admin.charts.rolesBreakdown")}
            </p>
            <div className="h-[240px] max-[1100px]:h-[220px]">
              <Doughnut
                data={roleChart}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: "#94a3b8",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="rounded-[12px] border border-(--stroke-soft) p-[12px]">
            <p className="mb-[10px] text-[13px] font-semibold text-(--color-fixed-text)">
              {t("admin.charts.verificationBreakdown")}
            </p>
            <div className="h-[240px] max-[1100px]:h-[220px]">
              <Doughnut
                data={verificationChart}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: "#94a3b8",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="col-span-2 rounded-[12px] border border-(--stroke-soft) p-[12px] max-[1200px]:col-span-1">
            <p className="mb-[10px] text-[13px] font-semibold text-(--color-fixed-text)">
              {t("admin.charts.activity14d")}
            </p>
            <div className="h-[300px] max-[1100px]:h-[260px]">
              <Bar
                data={activityBar}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: "#94a3b8",
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        color: "#94a3b8",
                        maxRotation: 0,
                        autoSkip: true,
                      },
                      grid: {
                        color: "rgba(148, 163, 184, 0.15)",
                      },
                    },
                    y: {
                      ticks: {
                        color: "#94a3b8",
                        precision: 0,
                      },
                      grid: {
                        color: "rgba(148, 163, 184, 0.12)",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
