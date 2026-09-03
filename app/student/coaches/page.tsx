import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/get-current-profile";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { ChooseCoachButton } from "./choose-coach-button";

export default async function StudentCoachesPage() {
  const student = await getCurrentStudent();
  const supabase = await createClient();

  const { data: coaches } = await supabase
    .from("coach_public_profile")
    .select("*")
    .eq("profile_published", true)
    .order("full_name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Koçlar</h1>
      <p className="text-sm text-muted-foreground">Profile Published olan koçları görüntüleyebilirsiniz.</p>

      {(coaches ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Şu anda yayında olan koç bulunmuyor.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(coaches ?? []).map((coach: any) => (
            <Card key={coach.id} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{initials(coach.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{coach.full_name}</p>
                    {coach.university && <p className="text-xs text-muted-foreground">{coach.university}</p>}
                    {coach.department && <p className="text-xs text-muted-foreground">{coach.department}</p>}
                  </div>
                </div>
                {coach.bio && <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{coach.bio}</p>}
                <div className="flex flex-wrap gap-2 mb-3">
                  {coach.own_exam_field && <Badge variant="secondary">{coach.own_exam_field}</Badge>}
                  {coach.own_exam_rank && <Badge variant="outline">Sıralama: {coach.own_exam_rank.toLocaleString()}</Badge>}
                  {coach.student_quota > 0 && <Badge variant="outline">Kontenjan: {coach.student_quota}</Badge>}
                </div>
                <ChooseCoachButton coachId={coach.id} currentCoachId={(student as any).coach_id} studentId={student.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
