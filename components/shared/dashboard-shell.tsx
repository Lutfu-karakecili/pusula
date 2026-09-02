import type { ReactNode } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { Topbar } from "@/components/shared/topbar";
import type { NavItem } from "@/lib/nav-config";

export function DashboardShell({
  navItems,
  roleLabel,
  pageTitle,
  pageSubtitle,
  userName,
  avatarUrl,
  children,
}: {
  navItems: NavItem[];
  roleLabel: string;
  pageTitle: string;
  pageSubtitle?: string;
  userName: string;
  avatarUrl?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar items={navItems} roleLabel={roleLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={pageTitle} subtitle={pageSubtitle} userName={userName} avatarUrl={avatarUrl} />
        <main className="flex-1 space-y-6 p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>
      <MobileNav items={navItems} />
    </div>
  );
}
