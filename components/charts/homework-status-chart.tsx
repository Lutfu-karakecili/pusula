"use client";

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { useTheme } from "next-themes";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function HomeworkStatusChart({
  labels,
  completed,
  pending,
}: {
  labels: string[];
  completed: number[];
  pending: number[];
}) {
  const { resolvedTheme } = useTheme();
  const gridColor = resolvedTheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textColor = resolvedTheme === "dark" ? "#a1a1aa" : "#71717a";

  return (
    <div className="h-64 w-full">
      <Bar
        data={{
          labels,
          datasets: [
            { label: "Tamamlanan", data: completed, backgroundColor: "#22c55e", borderRadius: 6 },
            { label: "Bekleyen", data: pending, backgroundColor: "#f97316", borderRadius: 6 },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: textColor, usePointStyle: true } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true },
          },
        }}
      />
    </div>
  );
}
