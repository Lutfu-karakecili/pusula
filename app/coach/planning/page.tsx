import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanBuilder } from "./plan-builder";

export default async function CoachPlanningPage() {
  const coach = await getCurrentProfile();
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, profile:profiles!students_id_fkey(full_name)")
    .eq("coach_id", coach.id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Haftalık Plan Oluştur</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanBuilder students={(students ?? []) as any} coachId={coach.id} />
        </CardContent>
      </Card>
    </div>
  );
}
