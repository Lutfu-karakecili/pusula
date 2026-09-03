"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass, LogOut, Home,
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardList,
  BookOpenCheck, Video, MessageSquareText, UserCog, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavItem, IconName } from "@/lib/nav-config";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ICONS: Record<IconName, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardList,
  BookOpenCheck, Video, MessageSquareText, UserCog, Sparkles,
  Home,
};

export function Sidebar({ items, roleLabel }: { items: NavItem[]; roleLabel: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/50 md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-pusula text-white">
          <Compass className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none">Pusula</p>
          <p className="text-[11px] text-muted-foreground">{roleLabel} Paneli</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gradient-pusula text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
          Siteye Dön
        </Link>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </Button>
      </div>
    </aside>
  );
}
