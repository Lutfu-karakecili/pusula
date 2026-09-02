"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardList,
  BookOpenCheck, Video, MessageSquareText, UserCog, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem, IconName } from "@/lib/nav-config";

const ICONS: Record<IconName, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardList,
  BookOpenCheck, Video, MessageSquareText, UserCog, Sparkles,
};

// Mobile-first: alt sekme çubuğu (bottom tab bar)
export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur md:hidden">
      {items.slice(0, 5).map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
