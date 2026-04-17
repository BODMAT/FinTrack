import Select from "react-select";
import { Bar } from "react-chartjs-2";
import type { Range } from "@fintrack/types";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import {
  CHART_INCOME_COLOR,
  CHART_OUTCOME_COLOR,
  rangeOptions,
} from "@/utils/monobank";

interface MonobankStatsChartProps {
  range: Range;
  setRange: (range: Range) => void;
  chart: {
    labels: string[];
    income: number[];
    outcome: number[];
  };
}

export function MonobankStatsChart({
  range,
  setRange,
  chart,
}: MonobankStatsChartProps) {
  const { t } = useSafeTranslation();

  return (
    <section className="neo-panel p-[16px]">
      <div className="mb-[12px] flex items-center justify-between gap-[12px] max-[560px]:flex-col max-[560px]:items-start">
        <h3 className="text-(--color-text) text-[20px] font-semibold">
          {t("monobank.analyticsTitle")}
        </h3>
        <Select
          options={rangeOptions}
          value={rangeOptions.find((option) => option.value === range)}
          onChange={(value) => setRange(value?.value ?? "all")}
          isClearable={false}
          menuPlacement="auto"
          styles={{
            control: (base) => ({
              ...base,
              backgroundColor: "var(--color-input)",
              borderColor: "var(--stroke-soft)",
              borderRadius: "10px",
              minWidth: 160,
              boxShadow: "none",
            }),
            singleValue: (base) => ({
              ...base,
              color: "var(--color-text)",
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isFocused
                ? "var(--color-hover-reverse)"
                : "var(--color-input)",
              color: state.isFocused
                ? "var(--color-hover)"
                : "var(--color-text)",
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--stroke-soft)",
            }),
          }}
        />
      </div>

      <div className="h-[320px] min-w-[260px]">
        <Bar
          data={{
            labels: chart.labels,
            datasets: [
              {
                label: t("dashboard.card.income"),
                data: chart.income,
                backgroundColor: CHART_INCOME_COLOR,
                borderRadius: 6,
              },
              {
                label: t("dashboard.card.outcome"),
                data: chart.outcome,
                backgroundColor: CHART_OUTCOME_COLOR,
                borderRadius: 6,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
            },
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          }}
        />
      </div>
    </section>
  );
}
