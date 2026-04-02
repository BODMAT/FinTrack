import type { DashboardCardProps } from "@/types/summary";
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
import { NoData } from "@/shared/ui/Helpers";

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
          borderColor: "var(--chart-income)",
          backgroundColor:
            "color-mix(in srgb, var(--chart-income) 24%, transparent)",
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
          borderColor: "var(--chart-outcome)",
          backgroundColor:
            "color-mix(in srgb, var(--chart-outcome) 24%, transparent)",
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
          borderColor: "var(--chart-income)",
          backgroundColor:
            "color-mix(in srgb, var(--chart-income) 24%, transparent)",
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
          borderColor: "var(--chart-income)",
          backgroundColor:
            "color-mix(in srgb, var(--chart-income) 24%, transparent)",
          fill: "start",
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: "Outcome",
          data: outcome,
          borderColor: "var(--chart-outcome)",
          backgroundColor:
            "color-mix(in srgb, var(--chart-outcome) 24%, transparent)",
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
    <div className="flex flex-col gap-[16px]">
      <DashboardCard
        myImg={myImg}
        title={title}
        reversedPercentage={reversedPercentage}
        inPopup
      />
      <div className="neo-panel p-[16px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
