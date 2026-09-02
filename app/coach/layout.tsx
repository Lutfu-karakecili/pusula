import { DashboardShell } from "@/components/shared/dashboard-shell";
import { COACH_NAV } from "@/lib/nav-config";
import { getCurrentProfile } from "@/lib/get-current-profile";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <DashboardShell
      navItems={COACH_NAV}
      roleLabel="Koç"
      pageTitle="Koç Paneli"
      pageSubtitle="Öğrencilerini yönet, plan ve ödev ata"
      userName={profile.full_name}
      avatarUrl={profile.avatar_url}
    >
      {children}
    </DashboardShell>
  );
}
