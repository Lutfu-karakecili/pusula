import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials, FIELD_LABELS } from "@/lib/utils";
import { ReviewForm } from "./review-form";
import { StarRating } from "./star-rating";

export default async function CoachDetailPage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = await params;
  const student = await getCurrentStudent();
  const supabase = await createClient();

  const { data: coach } = await supabase
    .from("coach_public_profile")
    .select("*")
    .eq("id", coachId)
    .single();

  if (!coach) notFound();

  const [{ data: ratingSummary }, { data: reviews }, { data: existingReview }] = await Promise.all([
    supabase.from("coach_rating_summary").select("avg_rating, review_count").eq("coach_id", coachId).maybeSingle(),
    supabase.from("coach_reviews").select("*, student:students(profile:profiles!students_id_fkey(full_name))").eq("coach_id", coachId).order("created_at", { ascending: false }),
    supabase.from("coach_reviews").select("*").eq("coach_id", coachId).eq("student_id", student.id).maybeSingle(),
  ]);

  const isMyCoach = (student as any).coach_id === coachId;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">{initials(coach.full_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{coach.full_name}</h1>
            {coach.university && <p className="text-sm text-muted-foreground">{coach.university}</p>}
            {coach.department && <p className="text-sm text-muted-foreground">{coach.department}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {coach.own_exam_field && <Badge variant="secondary">{FIELD_LABELS[coach.own_exam_field] ?? coach.own_exam_field}</Badge>}
            {coach.own_exam_rank && <Badge variant="outline">Sıralama: {coach.own_exam_rank.toLocaleString()}</Badge>}
            {ratingSummary && (
              <Badge variant="outline">
                {ratingSummary.avg_rating}/5 ({ratingSummary.review_count})
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {coach.bio && (
        <Card>
          <CardHeader><CardTitle>Hakkında</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{coach.bio}</p></CardContent>
        </Card>
      )}

      {isMyCoach && (
        <Card>
          <CardHeader><CardTitle>Koçumu Değerlendir</CardTitle></CardHeader>
          <CardContent>
            <ReviewForm coachId={coachId} existingReview={existingReview as any} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Değerlendirmeler ({reviews?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(!reviews || reviews.length === 0) ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Henüz değerlendirme yok.</p>
          ) : reviews.map((r: any) => (
            <div key={r.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{r.student?.profile?.full_name ?? "Öğrenci"}</span>
                  <StarRating value={r.rating} readOnly size="sm" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
