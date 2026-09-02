export type IconName =
  | "LayoutDashboard" | "Users" | "GraduationCap" | "CalendarDays"
  | "ClipboardList" | "BookOpenCheck" | "Video" | "MessageSquareText"
  | "UserCog" | "Sparkles";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

export const ADMIN_NAV: NavItem[] = [
  { label: "Panel", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Öğrenciler", href: "/dashboard/students", icon: "GraduationCap" },
  { label: "Koçlar", href: "/dashboard/coaches", icon: "Users" },
  { label: "Kullanıcılar", href: "/dashboard/users", icon: "UserCog" },
];

export const COACH_NAV: NavItem[] = [
  { label: "Panel", href: "/coach/dashboard", icon: "LayoutDashboard" },
  { label: "Haftalık Plan", href: "/coach/planning", icon: "CalendarDays" },
  { label: "Ödevler", href: "/coach/homework", icon: "BookOpenCheck" },
  { label: "Görüşmeler", href: "/coach/meetings", icon: "Video" },
];

export const STUDENT_NAV: NavItem[] = [
  { label: "Panel", href: "/student/dashboard", icon: "LayoutDashboard" },
  { label: "AI Sohbet", href: "/student/ai", icon: "Sparkles" },
  { label: "Haftalık Plan", href: "/student/planning", icon: "CalendarDays" },
  { label: "Ödevler", href: "/student/homework", icon: "ClipboardList" },
  { label: "Görüşmeler", href: "/student/meetings", icon: "Video" },
  { label: "Profil", href: "/student/profile", icon: "MessageSquareText" },
];
