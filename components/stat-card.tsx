"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  gradient?: "purple" | "green" | "blue" | "orange" | "pink";
}

const gradients = {
  purple: "from-purple-500/20 to-indigo-500/20 border-purple-500/30",
  green: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
  blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  orange: "from-orange-500/20 to-amber-500/20 border-orange-500/30",
  pink: "from-pink-500/20 to-rose-500/20 border-pink-500/30",
};

const iconColors = {
  purple: "text-purple-400",
  green: "text-emerald-400",
  blue: "text-blue-400",
  orange: "text-orange-400",
  pink: "text-pink-400",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  gradient = "purple",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-br border p-5 transition-all hover:scale-[1.02]",
        gradients[gradient]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-emerald-400",
                  trend === "down" && "text-red-400",
                  trend === "neutral" && "text-slate-400"
                )}
              >
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl bg-slate-800/50", iconColors[gradient])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
