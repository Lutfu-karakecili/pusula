import { GraduationCap, ClipboardList, Video, TrendingUp } from "lucide-react";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials, formatDate, FIELD_LABELS, greeting } from "@/lib/utils";
import Link from "next/link";

export default async function CoachDashboardPage() {
  const coach = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: students }, { count: pendingHomework }, { data: upcomingMeetings }] = await Promise.all([
    supabase.from("students").select("*, profile:profiles!students_id_fkey(*)").eq("coach_id", coach.id),
    supabase.from("homework").select("*", { count: "exact", head: true }).eq("coach_id", coach.id).eq("status", "pending"),
    supabase.from("meetings").select("*, student:students(profile:profiles!students_id_fkey(full_name))").eq("coach_id", coach.id).eq("status", "scheduled").order("scheduled_at").limit(5),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{greeting()}, {coach.full_name.split(" ")[0]}!</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Öğrencilerim" value={students?.length ?? 0} icon={GraduationCap} />
        <StatCard label="Bekleyen Ödev" value={pendingHomework ?? 0} icon={ClipboardList} />
        <StatCard label="Planlı Görüşme" value={upcomingMeetings?.length ?? 0} icon={Video} />
        <StatCard label="Ort. Hedef Net" value={students?.length ? Math.round((students.reduce((a, s: any) => a + (s.target_score ?? 0), 0) / students.length) * 10) / 10 : "-"} icon={TrendingUp} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Öğrencilerim</CardTitle>
            <CardDescription>Koçluk verdiğin öğrenciler ve hedef alanları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(students ?? []).length === 0 && <p className="text-sm text-muted-foreground">Henüz öğrenci atanmadı.</p>}
            {(students ?? []).map((s: any) => (
              <Link
                key={s.id}
                href={`/coach/student/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(s.profile.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{s.profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.grade ? `${s.grade}. Sınıf` : "Sınıf belirtilmedi"}</p>
                  </div>
                </div>
                {s.target_field && <Badge variant="secondary">{FIELD_LABELS[s.target_field]}</Badge>}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Görüşmeler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(upcomingMeetings ?? []).length === 0 && <p className="text-sm text-muted-foreground">Planlı görüşme yok.</p>}
            {(upcomingMeetings ?? []).map((m: any) => (
              <div key={m.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{m.student?.profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(m.scheduled_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
