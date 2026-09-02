"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  gradient?: "purple" | "green" | "blue" | "orange" | "pink";
}

const gradients = {
  purple: "from-indigo-600/20 via-purple-600/20 to-indigo-600/20 border-indigo-500/20",
  green: "from-emerald-600/20 via-green-600/20 to-emerald-600/20 border-emerald-500/20",
  blue: "from-blue-600/20 via-cyan-600/20 to-blue-600/20 border-blue-500/20",
  orange: "from-orange-600/20 via-amber-600/20 to-orange-600/20 border-orange-500/20",
  pink: "from-pink-600/20 via-rose-600/20 to-pink-600/20 border-pink-500/20",
};

const iconBg = {
  purple: "bg-indigo-500/20 text-indigo-400",
  green: "bg-emerald-500/20 text-emerald-400",
  blue: "bg-blue-500/20 text-blue-400",
  orange: "bg-orange-500/20 text-orange-400",
  pink: "bg-pink-500/20 text-pink-400",
};

export function StatCard({ title, value, icon, trend, trendValue, gradient = "purple" }: StatCardProps) {
  return (
    <Card className={cn("bg-gradient-to-br border", gradients[gradient])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium",
                trend === "up" ? "text-emerald-400" : "text-red-400"
              )}>
                {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trendValue}
              </div>
            )}
          </div>
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", iconBg[gradient])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
