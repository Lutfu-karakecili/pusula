import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CoachProfileForm } from "./coach-profile-form";

export default async function CoachProfilePage() {
  const profile = await getCurrentProfile();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profil Ayarları</h1>
      <Card>
        <CardHeader>
          <CardTitle>Koç Profili</CardTitle>
          <CardDescription>Kişisel, akademik ve finansal bilgilerini düzenle</CardDescription>
        </CardHeader>
        <CardContent>
          <CoachProfileForm profile={profile as any} />
        </CardContent>
      </Card>
    </div>
  );
}
