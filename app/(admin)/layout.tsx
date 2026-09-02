import { DashboardShell } from "@/components/shared/dashboard-shell";
import { ADMIN_NAV } from "@/lib/nav-config";
import { getCurrentProfile } from "@/lib/get-current-profile";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <DashboardShell
      navItems={ADMIN_NAV}
      roleLabel="Yönetici"
      pageTitle="Yönetim Paneli"
      pageSubtitle="Pusula — YKS Koçluk Platformu"
      userName={profile.full_name}
      avatarUrl={profile.avatar_url}
    >
      {children}
    </DashboardShell>
  );
}
