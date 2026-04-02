import { usePopupStore } from "@/store/popup";
import { usePeriodStore } from "@/store/period";
import { useAuth } from "@/hooks/useAuth";
import { ErrorCustom, NoData, Spinner } from "@/shared/ui/Helpers";
import type { DashboardCardProps } from "@/types/summary";
import { PopupDashboardCard } from "./PopupDashboardCard";
import { useSummary } from "@/hooks/useSummary";
import { getStats } from "@/types/summary";
import React from "react";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

export function DashboardCard({
  myImg,
  title,
  reversedPercentage = false,
  inPopup = false,
}: DashboardCardProps) {
  const { t } = useSafeTranslation();
  const { open } = usePopupStore();
  const { period } = usePeriodStore();
  const { user, isLoading, isError } = useAuth();
  const {
    summary,
    chart,
    isLoading: isSummaryOrChartLoading,
    isError: isSummaryOrChartError,
  } = useSummary(period);

  if (isLoading || isSummaryOrChartLoading) return <Spinner />;
  if (isError || isSummaryOrChartError) return <ErrorCustom />;
  if (isError || !summary || !user) return <NoData />;

  let total: number = 0;
  let percentage: number = 0;

  if (title === "balance") {
    total = summary.currentBalance;
    percentage = 0;
  } else {
    const stats = getStats(summary, period);
    const config = {
      income: {
        totalKey: "totalIncomePerRange",
        percentKey: "percentageIncomePerRange",
      },
      outcome: {
        totalKey: "totalOutcomePerRange",
        percentKey: "percentageOutcomePerRange",
      },
      saving: {
        totalKey: "totalSavingPerRange",
        percentKey: "percentageSavingPerRange",
      },
    } as const;

    if (title in config) {
      const { totalKey, percentKey } = config[title as keyof typeof config];
      total = stats[totalKey];
      percentage = stats[percentKey];
    }
  }

  const titleText =
    title === "balance"
      ? t("dashboard.card.currentBalance")
      : t(`dashboard.card.${title}`) +
        " " +
        t("dashboard.card.per") +
        " " +
        (period === "all" ? t("dashboard.card.allTime") : period);

  const handleOpenPopup = () => {
    open(
      `${t("dashboard.card.graphWith")} ${titleText}`,
      <PopupDashboardCard
        myImg={myImg}
        title={title}
        reversedPercentage={reversedPercentage}
        inPopup
        dataForPopupChart={chart}
      />,
      true,
    );
  };

  return (
    <article className="neo-panel group relative overflow-hidden px-[18px] py-[16px] transitioned">
      <div className="pointer-events-none absolute right-[-36px] top-[-34px] h-[120px] w-[120px] rounded-full bg-(--color-hover-reverse) blur-[36px] transitioned group-hover:scale-110" />

      <div className="relative mb-5.5 flex justify-between gap-10">
        {typeof myImg === "string" && <img src={myImg} alt={myImg} />}
        {typeof myImg === "function" &&
          React.createElement(myImg, {
            className: "h-[44px] w-[44px]",
          })}

        {!inPopup && (
          <button
            onClick={handleOpenPopup}
            className="cursor-pointer rounded-[8px] px-[6px] py-[2px] text-[28px] leading-[1] text-(--color-text) transitioned hover:bg-(--color-hover-reverse) hover:text-(--color-hover)"
          >
            ...
          </button>
        )}
      </div>

      <h3 className="mb-1.5 text-(--color-fixed-text) text-[14px] font-medium tracking-[0.02em]">
        {titleText}
      </h3>

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-(--color-text) text-[28px] font-bold tracking-[0.01em]">
          ${total.toFixed(2)}
        </h3>

        {period !== "all" && title !== "balance" && (
          <h4
            className={`rounded-[12px] px-[10px] py-[4px] text-[13px] font-semibold ${
              percentage > 0
                ? reversedPercentage
                  ? "bg-(--bg-red) text-(--text-red)"
                  : "bg-(--bg-green) text-(--text-green)"
                : "bg-(--bg-red) text-(--text-red)"
            }`}
            title={`Change: ${percentage > 0 ? "+" : ""}${percentage}%`}
            aria-label={`Percentage change: ${percentage > 0 ? "+" : ""}${percentage} percent`}
          >
            {percentage > 0 ? "+" : ""}
            {percentage}%
          </h4>
        )}
      </div>
    </article>
  );
}
