import type { ChartData } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

export function AdminDoughnutCard({
  title,
  data,
}: {
  title: string;
  data: ChartData<"doughnut">;
}) {
  return (
    <div className="rounded-[12px] border border-(--stroke-soft) p-[12px]">
      <p className="mb-[10px] text-[13px] font-semibold text-(--color-fixed-text)">
        {title}
      </p>
      <div className="h-[240px] max-[1100px]:h-[220px]">
        <Doughnut
          data={data}
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
  );
}

export function AdminBarCard({
  title,
  data,
}: {
  title: string;
  data: ChartData<"bar">;
}) {
  return (
    <div className="col-span-2 rounded-[12px] border border-(--stroke-soft) p-[12px] max-[1200px]:col-span-1">
      <p className="mb-[10px] text-[13px] font-semibold text-(--color-fixed-text)">
        {title}
      </p>
      <div className="h-[300px] max-[1100px]:h-[260px]">
        <Bar
          data={data}
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
  );
}
