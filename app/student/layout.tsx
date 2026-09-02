import { DashboardShell } from "@/components/shared/dashboard-shell";
import { STUDENT_NAV } from "@/lib/nav-config";
import { getCurrentProfile } from "@/lib/get-current-profile";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <DashboardShell
      navItems={STUDENT_NAV}
      roleLabel="Öğrenci"
      pageTitle="Öğrenci Paneli"
      pageSubtitle="YKS yolculuğun burada"
      userName={profile.full_name}
      avatarUrl={profile.avatar_url}
    >
      {children}
    </DashboardShell>
  );
}
