import { getCurrentProfile } from "@/lib/get-current-profile";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { PARENT_NAV } from "@/lib/nav-config";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <DashboardShell
      navItems={PARENT_NAV}
      roleLabel="Veli"
      pageTitle="Veli Paneli"
      pageSubtitle="Çocuğunuzun ilerlemesini takip edin"
      userName={profile.full_name}
      avatarUrl={profile.avatar_url}
    >
      {children}
    </DashboardShell>
  );
}
