import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeworkAssignForm } from "./assign-form";
import { HomeworkReviewRow } from "./review-row";

export default async function CoachHomeworkPage() {
  const coach = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: students }, { data: homework }] = await Promise.all([
    supabase.from("students").select("id, profile:profiles!students_id_fkey(full_name)").eq("coach_id", coach.id),
    supabase.from("homework").select("*, student:students(profile:profiles(full_name))").eq("coach_id", coach.id).order("due_date", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Ödev Ata</CardTitle></CardHeader>
        <CardContent>
          <HomeworkAssignForm students={(students ?? []) as any} coachId={coach.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Atanan Ödevler</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(homework ?? []).length === 0 && <p className="text-sm text-muted-foreground">Henüz ödev atanmadı.</p>}
          {(homework ?? []).map((h: any) => <HomeworkReviewRow key={h.id} homework={h} />)}
        </CardContent>
      </Card>
    </div>
  );
}
