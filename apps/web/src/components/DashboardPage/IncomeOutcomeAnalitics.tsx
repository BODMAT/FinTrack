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
import { usePeriodStore } from "../../store/period";
import { ErrorCustom, NoData, Spinner } from "../Helpers";
import type { Range } from "../../types/summary";
import { useSummary } from "../../hooks/useSummary";

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
			{ label: "Income", data: income, backgroundColor: "#d64bc2" },
			{ label: "Outcome", data: outcome, backgroundColor: "#ffd4f4" },
		],
	};

	return (
		<div className="w-full mx-auto px-[32px] py-[26px] border-1 border-[var(--color-fixed-text)] rounded-[10px] ">
			<div className="flex items-center justify-between gap-5 max-[440px]:flex-col">
				<h2 className="text-[var(--color-text)] text-[28px] font-medium">
					Analytics
				</h2>
				<div className="mb-4 flex gap-4 max-md:flex-col">
					<div className="flex max-[440px]:flex-col gap-[24px] text-[var(--color-fixed-text)] text-sm select-none">
						<div className="flex items-center gap-2">
							<span className="w-4 h-4 rounded-[50%] bg-[#d64bc2]"></span>
							Income
						</div>
						<div className="flex items-center gap-2">
							<span className="w-4 h-4 rounded-[50%] bg-[#ffd4f4]"></span>
							Outcome
						</div>
					</div>

					<Select
						options={selectDateOptions}
						value={selectDateOptions.find(
							(item) => item.value === range,
						)}
						onChange={(e) => setRange(e!.value)}
						isClearable={false}
						menuPlacement="auto"
						styles={{
							control: (base) => ({
								...base,
								backgroundColor: "transparent",
								borderColor: "var(--color-fixed-text)",
								borderWidth: "1px",
								borderRadius: "6px",
								color: "var(--color-fixed-text)",
								cursor: "pointer",
								boxShadow: "none",
							}),
							singleValue: (base) => ({
								...base,
								color: "var(--color-fixed-text)",
								cursor: "pointer",
							}),
							option: (base, state) => ({
								...base,
								backgroundColor: state.isFocused
									? "var(--color-hover)"
									: "var(--color-card)",
								color: state.isFocused
									? "var(--color-fixed)"
									: "var(--color-fixed-text)",
								cursor: "pointer",
							}),
							menu: (base) => ({
								...base,
								backgroundColor: "var(--color-card)",
								color: "var(--color-fixed-text)",
							}),
						}}
					/>
				</div>
			</div>
			<div className="w-full overflow-x-auto">
				<div className="min-w-[400px] h-[450px]">
					{chart ? (
						<Bar data={chartData} options={chartOptions} />
					) : (
						<Spinner />
					)}
				</div>
			</div>
		</div>
	);
}
