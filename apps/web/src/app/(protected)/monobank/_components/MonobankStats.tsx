import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import type { Range } from "@fintrack/types";
import { useCurrency } from "@/hooks/useCurrency";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import type { StatsTransaction } from "@/types/monobank-ui";
import {
  buildChartData,
  filterByRange,
  getPercentage,
  getPreviousDateByRange,
  getTotals,
} from "@/utils/monobank";
import { MonobankStatsChart } from "./MonobankStatsChart";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export function MonobankStats({ items }: { items: StatsTransaction[] }) {
  const { t } = useSafeTranslation();
  const { displayCurrency, convertAmount, formatMoney } = useCurrency();
  const [range, setRange] = useState<Range>("all");
  const convertedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        amount: convertAmount(item.amount, item.currencyCode, displayCurrency),
      })),
    [items, convertAmount, displayCurrency],
  );

  const current = useMemo(
    () => getTotals(filterByRange(convertedItems, range)),
    [convertedItems, range],
  );
  const overall = useMemo(() => getTotals(convertedItems), [convertedItems]);
  const previous = useMemo(
    () =>
      getTotals(
        filterByRange(convertedItems, range, getPreviousDateByRange(range)),
      ),
    [convertedItems, range],
  );
  const chart = useMemo(
    () => buildChartData(convertedItems, range),
    [convertedItems, range],
  );

  const statsCards = [
    {
      key: "balance",
      label: t("monobank.currentBalance"),
      total: overall.balance,
      percent: 0,
      reversed: false,
    },
    {
      key: "income",
      label: t("dashboard.card.income"),
      total: current.income,
      percent: getPercentage(current.income, previous.income),
      reversed: false,
    },
    {
      key: "saving",
      label: t("dashboard.card.saving"),
      total: current.saving,
      percent: getPercentage(current.saving, previous.saving),
      reversed: false,
    },
    {
      key: "outcome",
      label: t("dashboard.card.outcome"),
      total: current.outcome,
      percent: getPercentage(current.outcome, previous.outcome),
      reversed: true,
    },
  ];

  return (
    <div className="space-y-[16px]">
      <div className="grid grid-cols-2 gap-[12px] max-[520px]:grid-cols-1">
        {statsCards.map((card) => (
          <article key={card.key} className="neo-panel p-[14px]">
            <h3 className="text-(--color-fixed-text) text-[13px]">
              {card.label}
            </h3>
            <div className="mt-[8px] flex items-center justify-between">
              <strong className="text-(--color-text) text-[24px]">
                {formatMoney(card.total, displayCurrency)}
              </strong>
              {range !== "all" &&
                card.key !== "balance" &&
                card.percent !== null && (
                  <span
                    className={`rounded-[10px] px-[8px] py-[4px] text-[12px] ${
                      card.reversed
                        ? card.percent <= 0
                          ? "bg-(--bg-green) text-(--text-green)"
                          : "bg-(--bg-red) text-(--text-red)"
                        : card.percent >= 0
                          ? "bg-(--bg-green) text-(--text-green)"
                          : "bg-(--bg-red) text-(--text-red)"
                    }`}
                  >
                    {card.percent > 0 ? "+" : ""}
                    {card.percent}%
                  </span>
                )}
            </div>
          </article>
        ))}
      </div>

      <MonobankStatsChart range={range} setRange={setRange} chart={chart} />
    </div>
  );
}
