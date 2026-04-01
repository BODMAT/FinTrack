import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import Select from "react-select";
import { usePeriodStore } from "@/store/period";
import { ErrorCustom, NoData, Spinner } from "@/shared/ui/Helpers";
import type { Range } from "@fintrack/types";
import { useSummary } from "@/hooks/useSummary";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const selectDateOptions: Array<{ label: string; value: Range }> = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All time", value: "all" },
];

export function IncomeOutcomeAnalitics() {
  const { period: range, setPeriod: setRange } = usePeriodStore();
  const { chart, isChartLoading, isLoading, isError } = useSummary(range);

  if (isLoading || isChartLoading) return <Spinner />;
  if (isError) return <ErrorCustom />;

  if (!chart) return <NoData />;
  const { labels, income, outcome } = chart;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: { y: { beginAtZero: true } },
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: "Income",
        data: income,
        backgroundColor: "var(--chart-income)",
        borderRadius: 6,
      },
      {
        label: "Outcome",
        data: outcome,
        backgroundColor: "var(--chart-outcome)",
        borderRadius: 6,
      },
    ],
  };

  return (
    <section className="neo-panel neo-panel-glow h-full w-full px-[24px] py-[22px]">
      <div className="flex items-center justify-between gap-[20px] max-[440px]:flex-col">
        <h2 className="text-(--color-text) text-[28px] font-medium">
          Analytics
        </h2>
        <div className="mb-[16px] flex gap-[16px] max-md:flex-col">
          <div className="flex select-none gap-[24px] text-sm text-(--color-fixed-text) max-[440px]:flex-col">
            <div className="flex items-center gap-[8px]">
              <span className="h-[16px] w-[16px] rounded-[50%] bg-[var(--chart-income)]"></span>
              Income
            </div>
            <div className="flex items-center gap-[8px]">
              <span className="h-[16px] w-[16px] rounded-[50%] bg-[var(--chart-outcome)]"></span>
              Outcome
            </div>
          </div>

          <Select
            options={selectDateOptions}
            value={selectDateOptions.find((item) => item.value === range)}
            onChange={(e) => setRange(e!.value)}
            isClearable={false}
            menuPlacement="auto"
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "var(--color-input)",
                borderColor: "var(--stroke-soft)",
                borderWidth: "1px",
                borderRadius: "10px",
                color: "var(--color-fixed-text)",
                cursor: "pointer",
                boxShadow: "none",
              }),
              singleValue: (base) => ({
                ...base,
                color: "var(--color-text)",
                cursor: "pointer",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isFocused
                  ? "var(--color-hover-reverse)"
                  : "var(--color-input)",
                color: state.isFocused
                  ? "var(--color-hover)"
                  : "var(--color-text)",
                cursor: "pointer",
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--stroke-soft)",
                boxShadow: "var(--shadow-soft)",
                color: "var(--color-fixed-text)",
              }),
            }}
          />
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <div className="h-[420px] min-w-[400px]">
          {chart ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <Spinner />
          )}
        </div>
      </div>
    </section>
  );
}
