"use client";

import { useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartProps {
  type: "line" | "bar" | "doughnut";
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
  height?: number;
}

export function Chart({ type, labels, datasets, height = 300 }: ChartProps) {
  const chartData = {
    labels,
    datasets: datasets.map((ds) => ({
      ...ds,
      borderColor: ds.borderColor || "#8b5cf6",
      backgroundColor: ds.backgroundColor || "rgba(139, 92, 246, 0.1)",
      borderWidth: 2,
      tension: 0.4,
      pointRadius: type === "line" ? 4 : undefined,
      pointBackgroundColor: type === "line" ? "#8b5cf6" : undefined,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: datasets.length > 1,
        labels: { color: "#94a3b8", font: { size: 12 } },
      },
    },
    scales: type !== "doughnut" ? {
      x: {
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { color: "#94a3b8" },
      },
      y: {
        grid: { color: "rgba(148, 163, 184, 0.1)" },
        ticks: { color: "#94a3b8" },
      },
    } : undefined,
  };

  if (type === "line") return <div style={{ height }}><Line data={chartData} options={options as any} /></div>;
  if (type === "bar") return <div style={{ height }}><Bar data={chartData} options={options as any} /></div>;
  return <div style={{ height }}><Doughnut data={chartData} options={options as any} /></div>;
}
