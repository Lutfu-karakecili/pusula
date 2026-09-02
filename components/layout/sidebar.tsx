"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  CalendarCheck,
  ClipboardList,
  Video,
  Brain,
  User,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  Compass,
} from "lucide-react";

interface SidebarProps {
  role: "admin" | "coach" | "student";
  userName: string;
}

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
  { href: "/admin/stats", label: "İstatistikler", icon: BarChart3 },
];

const coachLinks = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/planning", label: "Haftalık Plan", icon: CalendarCheck },
  { href: "/coach/homework", label: "Ödevler", icon: ClipboardList },
  { href: "/coach/meetings", label: "Görüşmeler", icon: Video },
];

const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/planning", label: "Haftalık Plan", icon: CalendarCheck },
  { href: "/student/homework", label: "Ödevlerim", icon: ClipboardList },
  { href: "/student/meetings", label: "Görüşmelerim", icon: Video },
  { href: "/student/ai", label: "AI Asistan", icon: Brain },
  { href: "/student/profile", label: "Profilim", icon: User },
];

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const links = role === "admin" ? adminLinks : role === "coach" ? coachLinks : studentLinks;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
          <Compass className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            PUSULA
          </h1>
          <p className="text-[10px] text-muted-foreground">YKS Koçluk</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/20 text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-indigo-400")} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-xs font-bold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
