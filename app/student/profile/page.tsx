import { getCurrentStudent } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FIELD_LABELS, initials } from "@/lib/utils";
import { ProfileForm } from "./profile-form";
import { VerificationBanner } from "./verification-banner";

export default async function StudentProfilePage() {
  const student = await getCurrentStudent();
  const s = student as any;

  return (
    <div className="space-y-6">
      {s.verification_status !== "verified" && (
        <VerificationBanner status={s.verification_status ?? "missing"} studentId={student.id} />
      )}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">{initials(student.profile.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{student.profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{student.profile.email}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">{student.grade ? `${student.grade}. Sınıf` : "Sınıf belirtilmedi"}</Badge>
              {student.target_field && <Badge>{FIELD_LABELS[student.target_field]}</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
            <CardDescription>YKS hedeflerini ve iletişim bilgilerini güncelle</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm student={student} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
