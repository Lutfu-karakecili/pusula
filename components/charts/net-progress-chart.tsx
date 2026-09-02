"use client";

import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTheme } from "next-themes";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export interface NetPoint {
  date: string;
  tyt_net: number;
  ayt_net: number;
  exam_name: string;
}

export function NetProgressChart({ data }: { data: NetPoint[] }) {
  const { resolvedTheme } = useTheme();
  const gridColor = resolvedTheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const textColor = resolvedTheme === "dark" ? "#a1a1aa" : "#71717a";

  const chartData = {
    labels: data.map((d) => d.exam_name),
    datasets: [
      {
        label: "TYT Net",
        data: data.map((d) => d.tyt_net),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.15)",
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#6366f1",
      },
      {
        label: "AYT Net",
        data: data.map((d) => d.ayt_net),
        borderColor: "#a855f7",
        backgroundColor: "rgba(168,85,247,0.12)",
        tension: 0.35,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#a855f7",
      },
    ],
  };

  return (
    <div className="h-64 w-full">
      <Line
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, usePointStyle: true } },
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor }, beginAtZero: true },
          },
        }}
      />
    </div>
  );
}
