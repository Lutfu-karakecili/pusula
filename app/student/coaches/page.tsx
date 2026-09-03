import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/get-current-profile";
import { CoachesFilteredList } from "./coaches-filtered-list";

export default async function StudentCoachesPage() {
  const student = await getCurrentStudent();
  const supabase = await createClient();

  const { data: coaches } = await supabase
    .from("coach_public_profile")
    .select("*")
    .eq("profile_published", true)
    .order("full_name");

  // Her koç için atanmış öğrenci sayısını çek
  const coachIds = (coaches ?? []).map((c: any) => c.id);
  let counts: Record<string, number> = {};

  if (coachIds.length > 0) {
    const { data: scData } = await supabase
      .from("student_coaches")
      .select("coach_id")
      .in("coach_id", coachIds);

    if (scData) {
      for (const row of scData) {
        counts[row.coach_id] = (counts[row.coach_id] ?? 0) + 1;
      }
    }
  }

  // Her koç için rating summary çek
  const [{ data: ratings }] = await Promise.all([
    supabase.from("coach_rating_summary").select("coach_id, avg_rating, review_count"),
  ]);

  const ratingMap: Record<string, { avg_rating: number; review_count: number }> = {};
  for (const r of ratings ?? []) {
    ratingMap[r.coach_id] = { avg_rating: r.avg_rating, review_count: r.review_count };
  }

  const enriched = (coaches ?? []).map((c: any) => ({
    ...c,
    _count: { assigned: counts[c.id] ?? 0 },
    _rating: ratingMap[c.id] ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Koçlar</h1>
        <p className="text-sm text-muted-foreground">Profile Published olan koçları görüntüleyebilirsiniz.</p>
      </div>
      <CoachesFilteredList
        coaches={enriched}
        studentId={student.id}
        currentCoachId={(student as any).coach_id}
      />
    </div>
  );
}
