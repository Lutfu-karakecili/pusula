import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials, formatDate, formatDateTime, FIELD_LABELS } from "@/lib/utils";
import { NetProgressChart } from "@/components/charts/net-progress-chart";
import { NoteForm } from "./note-form";

export default async function CoachStudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coach = await getCurrentProfile();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*, profile:profiles!students_id_fkey(*)")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const [{ data: notes }, { data: homework }] = await Promise.all([
    supabase.from("coaching_notes").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("homework").select("*").eq("student_id", id).order("due_date", { ascending: false }).limit(5),
  ]);

  const netHistory = (student.net_history ?? []).slice(-6);

  const CATEGORY_LABEL: Record<string, string> = {
    genel: "Genel", motivasyon: "Motivasyon", akademik: "Akademik", davranis: "Davranış", aile: "Aile",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14"><AvatarFallback className="text-lg">{initials(student.profile.full_name)}</AvatarFallback></Avatar>
            <div>
              <p className="text-lg font-semibold">{student.profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{student.profile.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {student.grade && <Badge variant="secondary">{student.grade}. Sınıf</Badge>}
            {student.target_field && <Badge>{FIELD_LABELS[student.target_field]}</Badge>}
            {student.target_score && <Badge variant="outline">Hedef: {student.target_score} net</Badge>}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Net Gelişimi</CardTitle>
          </CardHeader>
          <CardContent>
            {netHistory.length > 0 ? <NetProgressChart data={netHistory} /> : <p className="py-8 text-center text-sm text-muted-foreground">Deneme verisi yok.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Son Ödevler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(homework ?? []).length === 0 && <p className="text-sm text-muted-foreground">Ödev kaydı yok.</p>}
            {(homework ?? []).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <span>{h.title}</span>
                <Badge variant={h.status === "reviewed" ? "success" : "secondary"}>{formatDate(h.due_date)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Koç Değerlendirme Notu</CardTitle>
          <CardDescription>Öğrenciye görünürlük ayarını sen belirlersin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <NoteForm studentId={id} coachId={coach.id} />
          <div className="space-y-3 pt-2">
            {(notes ?? []).map((n) => (
              <div key={n.id} className="rounded-lg border border-border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <Badge variant="outline">{CATEGORY_LABEL[n.category]}</Badge>
                  <div className="flex items-center gap-2">
                    {n.visible_to_student && <Badge variant="success">Öğrenciye Görünür</Badge>}
                    <span className="text-xs text-muted-foreground">{formatDateTime(n.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm">{n.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
