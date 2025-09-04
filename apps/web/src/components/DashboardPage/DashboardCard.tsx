import React from "react";
import { usePopupStore } from "../../store/popup";
import { usePeriodStore } from "../../store/period";
import { useUser } from "../../hooks/useUser";
import { ErrorCustom, NoData, Spinner } from "../Helpers";
import type { DashboardCardProps } from "../../types/custom";
import { PopupDashboardCard } from "./PopupDashboardCard";

export function DashboardCard({ myImg, title, reversedPercentage = false, inPopup = false }: DashboardCardProps) {
    const { open } = usePopupStore();
    const { period } = usePeriodStore();
    const { transactions, isLoading, error, getStats } = useUser();

    if (isLoading) return <Spinner />;
    if (error) return <ErrorCustom />;
    if (!transactions || !transactions.length) return <NoData />;

    const stats = getStats(period, title);
    if (!stats) return <NoData />;

    const { total, percentage, currentRangeForChart } = stats;

    const handleOpenPopup = () => {
        open(
            `Graph with ${title === "balance"
                ? "Current balance"
                : `${title[0].toUpperCase() + title.slice(1)} per ${period === "all" ? "all time" : period}`
            }`,
            <PopupDashboardCard
                myImg={myImg}
                title={title}
                reversedPercentage={reversedPercentage}
                inPopup
                dataForPopupChart={currentRangeForChart}
            />,
            true
        );
    };

    return (
        <div className="flex-[calc(25%-13.5px)] p-[19px] border-1 border-[var(--color-fixed-text)] rounded-[10px] transitioned bg-transparent">
            <div className="flex justify-between gap-10 mb-[22px]">

                {typeof myImg === "string" && <img src={myImg} alt={myImg} />}
                {typeof myImg === "function" && React.createElement(myImg, { className: "w-[44px] h-[44px]" })}

                {!inPopup && (
                    <button onClick={handleOpenPopup} className="cursor-pointer rotate-[-90deg] text-3xl font-bold text-[var(--color-text)]">...</button>
                )}
            </div>
            <h3 className="mb-[6px] text-[var(--color-fixed-text)] font-medium text-[16px] tracking-[0.02em]">
                {
                    title === "balance"
                        ? "Current balance"
                        : `${title[0].toUpperCase() + title.slice(1)} per ${period === "all" ? "all time" : period}`
                }

            </h3>
            <div className="flex justify-between items-center gap-2">
                <h3 className="font-bold text-[25px] tracking-[0.02em] text-[var(--color-text)]">
                    ${total.toFixed(2)}
                </h3>
                {period !== "all" && title !== "balance" && (
                    <h4
                        className={`py-[7px] px-[10px] rounded-3xl text-[14px] ${percentage > 0
                            ? reversedPercentage
                                ? "bg-[var(--bg-red)] text-[var(--text-red)]"
                                : "bg-[var(--bg-green)] text-[var(--text-green)]"
                            : "bg-[var(--bg-red)] text-[var(--text-red)]"
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
    )
}