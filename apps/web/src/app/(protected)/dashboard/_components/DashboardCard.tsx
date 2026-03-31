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
    <div className="flex-[calc(25%-13.5px)] p-4.75 border border-(--color-fixed-text) rounded-[10px] transitioned bg-transparent">
      <div className="flex justify-between gap-10 mb-5.5">
        {typeof myImg === "string" && <img src={myImg} alt={myImg} />}
        {typeof myImg === "function" &&
          React.createElement(myImg, {
            className: "w-[44px] h-[44px]",
          })}

        {!inPopup && (
          <button
            onClick={handleOpenPopup}
            className="cursor-pointer -rotate-90 text-3xl font-bold text-(--color-text)"
          >
            ...
          </button>
        )}
      </div>
      <h3 className="mb-1.5 text-(--color-fixed-text) font-medium text-[16px] tracking-[0.02em]">
        {titleText}
      </h3>
      <div className="flex justify-between items-center gap-2">
        <h3 className="font-bold text-[25px] tracking-[0.02em] text-(--color-text)">
          ${total.toFixed(2)}
        </h3>
        {period !== "all" && title !== "balance" && (
          <h4
            className={`py-1.75 px-2.5 rounded-[12px]xl text-[14px] ${
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
    </div>
  );
}
