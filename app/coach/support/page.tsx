import { getCurrentProfile } from "@/lib/get-current-profile";
import { SupportCenter } from "@/components/shared/support-center";

export default async function CoachSupportPage() {
  const profile = await getCurrentProfile();
  return <SupportCenter userId={profile.id} />;
}
