"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";

ChartJS.register(ArcElement, Tooltip, Legend);

export function SubjectBreakdownChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const { resolvedTheme } = useTheme();
  const textColor = resolvedTheme === "dark" ? "#a1a1aa" : "#71717a";
  const palette = ["#6366f1", "#a855f7", "#ec4899", "#f97316", "#22c55e", "#06b6d4", "#eab308", "#ef4444"];

  return (
    <div className="mx-auto h-64 w-full max-w-xs">
      <Doughnut
        data={{
          labels,
          datasets: [{ data: values, backgroundColor: palette, borderWidth: 0 }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { color: textColor, boxWidth: 10, usePointStyle: true } } },
        }}
      />
    </div>
  );
}
