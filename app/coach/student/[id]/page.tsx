import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { initials, formatDate, formatDateTime, FIELD_LABELS } from "@/lib/utils";
import { NetProgressChart } from "@/components/charts/net-progress-chart";
import { StatCard } from "@/components/shared/stat-card";
import { CheckCircle, Clock, Users, CalendarDays } from "lucide-react";
import { NoteForm } from "./note-form";
import { ExamSessionForm } from "./exam-session-form";
import Link from "next/link";

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

  const [{ data: notes }, { data: homework }, { count: completedCount }, { count: pendingCount }, { count: meetingCount }, { data: examSessions }] = await Promise.all([
    supabase.from("coaching_notes").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("homework").select("*").eq("student_id", id).order("due_date", { ascending: false }).limit(5),
    supabase.from("homework").select("*", { count: "exact", head: true }).eq("student_id", id).eq("status", "reviewed"),
    supabase.from("homework").select("*", { count: "exact", head: true }).eq("student_id", id).in("status", ["pending", "submitted"]),
    supabase.from("meetings").select("*", { count: "exact", head: true }).eq("student_id", id),
    supabase.from("exam_sessions").select("*").eq("student_id", id).order("taken_at", { ascending: false }).limit(10),
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
            <Link href={`/coach/student/${id}/plan-history`}>
              <Button variant="outline" size="sm"><CalendarDays className="h-4 w-4" /> Plan Geçmişi</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tamamlanan Ödev" value={completedCount ?? 0} icon={CheckCircle} />
        <StatCard label="Bekleyen Ödev" value={pendingCount ?? 0} icon={Clock} />
        <StatCard label="Toplam Toplantı" value={meetingCount ?? 0} icon={Users} />
      </div>

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Son Sınav Oturumları</CardTitle>
          <ExamSessionForm studentId={id} />
        </CardHeader>
        <CardContent>
          {(examSessions ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Henüz sınav sonucu eklenmemiş.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                    <th className="pb-2">Sınav</th>
                    <th className="pb-2">Tarih</th>
                    <th className="pb-2">Süre</th>
                    <th className="pb-2">Doğru</th>
                    <th className="pb-2">Yanlış</th>
                    <th className="pb-2">Boş</th>
                    <th className="pb-2">Net</th>
                    <th className="pb-2">Başarı</th>
                  </tr>
                </thead>
                <tbody>
                  {examSessions!.map((es: any) => (
                    <tr key={es.id} className="border-b border-border last:border-0">
                      <td className="py-2 font-medium">{es.exam_name}</td>
                      <td className="py-2 text-muted-foreground">{formatDate(es.taken_at)}</td>
                      <td className="py-2 text-muted-foreground">{es.duration_minutes ? `${es.duration_minutes} dk` : "-"}</td>
                      <td className="py-2">{es.correct_count}</td>
                      <td className="py-2">{es.wrong_count}</td>
                      <td className="py-2">{es.blank_count}</td>
                      <td className="py-2 font-medium">{es.net}</td>
                      <td className="py-2">{es.success_rate != null ? `%${es.success_rate}` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
