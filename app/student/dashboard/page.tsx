import { CalendarDays, ClipboardList, Target, TrendingUp } from "lucide-react";
import { getCurrentStudent } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NetProgressChart } from "@/components/charts/net-progress-chart";
import { formatDate, formatDateTime, FIELD_LABELS } from "@/lib/utils";

export default async function StudentDashboardPage() {
  const student = await getCurrentStudent();
  const supabase = await createClient();

  const [{ data: homework }, { data: meetings }, { data: currentPlan }] = await Promise.all([
    supabase.from("homework").select("*").eq("student_id", student.id).order("due_date", { ascending: true }).limit(5),
    supabase.from("meetings").select("*, coach:profiles!meetings_coach_id_fkey(full_name)").eq("student_id", student.id).order("scheduled_at", { ascending: true }).limit(3),
    supabase.from("plans").select("*, plan_items(*)").eq("student_id", student.id).order("week_start", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const pendingHomework = (homework ?? []).filter((h) => h.status === "pending" || h.status === "late").length;
  const planItems = currentPlan?.plan_items ?? [];
  const doneItems = planItems.filter((p: any) => p.status === "done").length;
  const planProgress = planItems.length ? Math.round((doneItems / planItems.length) * 100) : 0;

  const netHistory = (student.net_history ?? []).slice(-6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Hedef Alan" value={student.target_field ? FIELD_LABELS[student.target_field] : "Belirsiz"} icon={Target} />
        <StatCard label="Hedef Net" value={student.target_score ?? "-"} icon={TrendingUp} />
        <StatCard label="Bekleyen Ödev" value={pendingHomework} icon={ClipboardList} />
        <StatCard label="Bu Hafta Plan İlerlemesi" value={`%${planProgress}`} icon={CalendarDays} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Net Gelişimi</CardTitle>
            <CardDescription>Son denemelerindeki TYT/AYT net değişimi</CardDescription>
          </CardHeader>
          <CardContent>
            {netHistory.length > 0 ? (
              <NetProgressChart data={netHistory} />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">Henüz deneme sonucu eklenmemiş.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Görüşmeler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(meetings ?? []).length === 0 && <p className="text-sm text-muted-foreground">Planlanmış görüşme yok.</p>}
            {(meetings ?? []).map((m: any) => (
              <div key={m.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{m.title}</p>
                <p className="text-xs text-muted-foreground">Koç: {m.coach?.full_name} · {formatDateTime(m.scheduled_at)}</p>
                {m.zoom_join_url && (
                  <a href={m.zoom_join_url} target="_blank" className="mt-1 inline-block text-xs font-medium text-primary hover:underline">
                    Zoom'a katıl →
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bu Haftaki Plan</CardTitle>
            <CardDescription>{currentPlan ? formatDate(currentPlan.week_start) : "Aktif plan yok"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={planProgress} />
            {planItems.slice(0, 4).map((item: any) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.subject} — {item.topic}</span>
                <Badge variant={item.status === "done" ? "success" : "secondary"}>
                  {item.status === "done" ? "Tamamlandı" : item.status === "in_progress" ? "Devam Ediyor" : "Bekliyor"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Ödevler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(homework ?? []).length === 0 && <p className="text-sm text-muted-foreground">Ödev bulunmuyor.</p>}
            {(homework ?? []).map((h) => (
              <div key={h.id} className="flex items-center justify-between text-sm">
                <span>{h.title}</span>
                <Badge variant={h.status === "reviewed" ? "success" : h.status === "late" ? "destructive" : "secondary"}>
                  {formatDate(h.due_date, { day: "2-digit", month: "short", year: undefined })}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
