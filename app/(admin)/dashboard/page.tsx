import { Users, GraduationCap, ClipboardList, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, formatDateTime, FIELD_LABELS } from "@/lib/utils";
import { HomeworkStatusChart } from "@/components/charts/homework-status-chart";
import { SubjectBreakdownChart } from "@/components/charts/subject-breakdown-chart";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: studentCount }, { count: coachCount }, { count: homeworkPending }, { data: recentMeetings }] =
    await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "coach"),
      supabase.from("homework").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("meetings")
        .select("id, title, scheduled_at, status, student:students(profile:profiles!students_id_fkey(full_name)), coach:profiles!meetings_coach_id_fkey(full_name)")
        .order("scheduled_at", { ascending: false })
        .limit(6),
    ]);

  const { data: students } = await supabase.from("students").select("target_field");
  const fieldCounts = (students ?? []).reduce<Record<string, number>>((acc, s: any) => {
    const key = s.target_field ?? "belirsiz";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Toplam Öğrenci" value={studentCount ?? 0} icon={GraduationCap} />
        <StatCard label="Aktif Koç" value={coachCount ?? 0} icon={Users} />
        <StatCard label="Bekleyen Ödev" value={homeworkPending ?? 0} icon={ClipboardList} />
        <StatCard label="Bu Hafta Görüşme" value={recentMeetings?.length ?? 0} icon={Video} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Son Görüşmeler</CardTitle>
            <CardDescription>Platform genelinde planlanan/gerçekleşen koçluk görüşmeleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(recentMeetings ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Henüz görüşme kaydı yok.</p>
            )}
            {(recentMeetings ?? []).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(m.student?.profile?.full_name ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.student?.profile?.full_name ?? "Öğrenci"}</p>
                    <p className="text-xs text-muted-foreground">Koç: {m.coach?.full_name ?? "-"} · {formatDateTime(m.scheduled_at)}</p>
                  </div>
                </div>
                <Badge variant={m.status === "completed" ? "success" : m.status === "cancelled" ? "destructive" : "secondary"}>
                  {m.status === "scheduled" ? "Planlandı" : m.status === "completed" ? "Tamamlandı" : m.status === "cancelled" ? "İptal" : "Gelmedi"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alan Dağılımı</CardTitle>
            <CardDescription>Öğrencilerin hedef alanları</CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectBreakdownChart
              labels={Object.keys(fieldCounts).map((k) => FIELD_LABELS[k] ?? "Belirsiz")}
              values={Object.values(fieldCounts)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Erişim</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <Link href="/dashboard/students" className="rounded-lg border border-border p-4 text-center text-sm font-medium hover:bg-accent">Öğrenciler</Link>
            <Link href="/dashboard/coaches" className="rounded-lg border border-border p-4 text-center text-sm font-medium hover:bg-accent">Koçlar</Link>
            <Link href="/dashboard/users" className="rounded-lg border border-border p-4 text-center text-sm font-medium hover:bg-accent">Kullanıcılar</Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Platform Geneli Ödev Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <HomeworkStatusChart
              labels={["Bu Hafta", "Geçen Hafta", "2 Hafta Önce"]}
              completed={[18, 22, 15]}
              pending={[6, 4, 9]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
