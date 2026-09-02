"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
} from "chart.js";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  fill?: boolean;
}

interface ChartContainerProps {
  type: "bar" | "line" | "pie" | "doughnut";
  title: string;
  labels: string[];
  datasets: Dataset[];
  height?: number;
  className?: string;
}

const chartComponents = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
};

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "top" as const,
      align: "end" as const,
      labels: {
        color: "rgba(255, 255, 255, 0.7)",
        font: { size: 12 },
        boxWidth: 12,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      titleColor: "#fff",
      bodyColor: "rgba(255, 255, 255, 0.8)",
      borderColor: "rgba(139, 92, 246, 0.3)",
      borderWidth: 1,
      cornerRadius: 8,
      padding: 10,
    },
  },
  scales: {
    x: {
      ticks: { color: "rgba(255, 255, 255, 0.5)" },
      grid: { color: "rgba(255, 255, 255, 0.05)" },
    },
    y: {
      ticks: { color: "rgba(255, 255, 255, 0.5)" },
      grid: { color: "rgba(255, 255, 255, 0.05)" },
    },
  },
};

function buildChartData(labels: string[], datasets: Dataset[]): ChartData<any> {
  return {
    labels,
    datasets: datasets.map((ds) => ({
      ...ds,
      backgroundColor: ds.backgroundColor ?? "rgba(139, 92, 246, 0.5)",
      borderColor: ds.borderColor ?? "rgba(139, 92, 246, 1)",
      borderWidth: ds.borderColor ? 2 : 0,
      fill: ds.fill ?? false,
    })),
  };
}

function getOptions(type: string) {
  if (type === "pie" || type === "doughnut") {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "right" as const,
          labels: {
            color: "rgba(255, 255, 255, 0.7)",
            font: { size: 12 },
            padding: 12,
          },
        },
        tooltip: defaultOptions.plugins?.tooltip,
      },
    };
  }
  return defaultOptions;
}

export function ChartContainer({
  type,
  title,
  labels,
  datasets,
  height = 300,
  className,
}: ChartContainerProps) {
  const ChartComponent = chartComponents[type];
  const chartData = buildChartData(labels, datasets);
  const options = getOptions(type);

  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/50 border border-purple-500/20 p-5 transition-all hover:border-purple-500/30",
        className
      )}
    >
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <div style={{ height }}>
        <ChartComponent data={chartData} options={options as any} />
      </div>
    </div>
  );
}
