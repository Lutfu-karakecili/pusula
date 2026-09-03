"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardList,
  BookOpenCheck, Video, MessageSquareText, UserCog, Sparkles, Home, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem, IconName } from "@/lib/nav-config";
import { createClient } from "@/lib/supabase/client";

const ICONS: Record<IconName, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardList,
  BookOpenCheck, Video, MessageSquareText, UserCog, Sparkles, Home,
};

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
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
        <button
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
        >
          <LogOut className="h-5 w-5" />
          Çıkış
        </button>
      </nav>
      <div className="h-16 md:hidden" />
    </>
  );
}
