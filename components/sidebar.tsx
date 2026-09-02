"use client";

import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { cn, getInitials } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Video,
  User,
  MessageSquare,
  Settings,
  LogOut,
  Users,
  BarChart3,
  FileText,
  Compass,
  ChevronLeft,
  Menu,
  Home,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "coach" | "student";
  avatar_url: string | null;
}

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Kullanıcılar", icon: Users },
  { href: "/admin/stats", label: "İstatistikler", icon: BarChart3 },
];

const coachLinks = [
  { href: "/coach/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach/planning", label: "Haftalık Planlar", icon: Calendar },
  { href: "/coach/homework", label: "Ödevler", icon: BookOpen },
  { href: "/coach/meetings", label: "Görüşmeler", icon: Video },
];

const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/planning", label: "Planlarım", icon: Calendar },
  { href: "/student/homework", label: "Ödevlerim", icon: BookOpen },
  { href: "/student/meetings", label: "Görüşmelerim", icon: Video },
  { href: "/student/ai", label: "AI Asistan", icon: MessageSquare },
  { href: "/student/profile", label: "Profilim", icon: User },
];

export function useSidebar() {
  return { Sidebar };
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    };
    getProfile();
  }, []);

  const links =
    profile?.role === "admin"
      ? adminLinks
      : profile?.role === "coach"
      ? coachLinks
      : studentLinks;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside
      className={cn(
        "h-screen bg-slate-900/80 border-r border-slate-800 flex flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold gradient-text">PUSULA</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-purple-600/20 text-purple-400 border border-purple-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <link.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        {profile && (
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                getInitials(profile.full_name || profile.email)
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile.full_name || profile.email}
                </p>
                <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
