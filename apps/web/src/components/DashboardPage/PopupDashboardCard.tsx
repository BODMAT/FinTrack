import type { DashboardCardProps } from "../../types/custom";
import { DashboardCard } from "./DashboardCard";
import { Line } from "react-chartjs-2";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
	type ChartDataset,
} from "chart.js";
import { NoData } from "../Helpers";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	Filler,
);

export function PopupDashboardCard({
	myImg,
	title,
	reversedPercentage,
	dataForPopupChart,
}: DashboardCardProps) {
	if (!dataForPopupChart) return <NoData />;
	const { income, outcome, labels } = dataForPopupChart;

	let datasets: ChartDataset<"line">[] = [];
	switch (title) {
		case "income":
			datasets = [
				{
					label: "Income",
					data: income,
					borderColor: "#d64bc2",
					backgroundColor: "rgba(214, 75, 194, 0.3)",
					fill: "start",
					tension: 0.3,
					pointRadius: 3,
				},
			];
			break;

		case "outcome":
			datasets = [
				{
					label: "Outcome",
					data: outcome,
					borderColor: "#ffd4f4",
					backgroundColor: "rgba(255, 212, 244, 0.3)",
					fill: "start",
					tension: 0.3,
					pointRadius: 3,
				},
			];
			break;

		case "saving": {
			const saving = income.map((inc, i) => inc - (outcome[i] ?? 0));
			datasets = [
				{
					label: "Saving",
					data: saving,
					borderColor: "#d64bc2",
					backgroundColor: "rgba(214, 75, 194, 0.3)",
					fill: "start",
					tension: 0.3,
					pointRadius: 3,
				},
			];
			break;
		}

		case "balance":
			datasets = [
				{
					label: "Income",
					data: income,
					borderColor: "#d64bc2",
					backgroundColor: "rgba(214, 75, 194, 0.3)",
					fill: "start",
					tension: 0.3,
					pointRadius: 3,
				},
				{
					label: "Outcome",
					data: outcome,
					borderColor: "#ffd4f4",
					backgroundColor: "rgba(255, 212, 244, 0.3)",
					fill: "start",
					tension: 0.3,
					pointRadius: 3,
				},
			];
			break;

		default:
			datasets = [];
	}

	const data = {
		labels,
		datasets,
	};

	const options = {
		responsive: true,
		plugins: {
			legend: {
				display: false,
			},
			title: {
				display: false,
			},
			tooltip: {
				mode: "index" as const,
				intersect: false,
			},
		},
		interaction: {
			mode: "nearest" as const,
			intersect: false,
		},
		scales: {
			y: {
				beginAtZero: true,
			},
			x: {
				ticks: {
					maxRotation: 45,
					minRotation: 45,
				},
			},
		},
	};

	return (
		<div className="flex flex-col gap-4">
			<DashboardCard
				myImg={myImg}
				title={title}
				reversedPercentage={reversedPercentage}
				inPopup
			/>
			<Line data={data} options={options} />
		</div>
	);
}
