import { CalendarDays, ClipboardList, Target, TrendingUp, CreditCard } from "lucide-react";
import { getCurrentStudent } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { NetProgressChart } from "@/components/charts/net-progress-chart";
import { formatDate, formatDateTime, FIELD_LABELS, greeting } from "@/lib/utils";

export default async function StudentDashboardPage() {
  const student = await getCurrentStudent();
  const supabase = await createClient();

  const [{ data: homework }, { data: meetings }, { data: currentPlan }, { data: examSessions }, { data: subscription }, { data: resources }, { data: seminars }] = await Promise.all([
    supabase.from("homework").select("*").eq("student_id", student.id).order("due_date", { ascending: true }).limit(5),
    supabase.from("meetings").select("*, coach:profiles!meetings_coach_id_fkey(full_name)").eq("student_id", student.id).order("scheduled_at", { ascending: true }).limit(3),
    supabase.from("plans").select("*, plan_items(*)").eq("student_id", student.id).order("week_start", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("exam_sessions").select("*").eq("student_id", student.id).order("taken_at", { ascending: false }).limit(6),
    supabase.from("subscriptions").select("*, package:packages(name)").eq("student_id", student.id).in("status", ["active", "pending_payment"]).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("resource_recommendations").select("*, coach:profiles!resource_recommendations_coach_id_fkey(full_name)").eq("student_id", student.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("seminars").select("*").gte("scheduled_at", new Date().toISOString()).order("scheduled_at", { ascending: true }).limit(3),
  ]);

  const pendingHomework = (homework ?? []).filter((h) => h.status === "pending" || h.status === "late").length;
  const planItems = currentPlan?.plan_items ?? [];
  const doneItems = planItems.filter((p: any) => p.status === "done").length;
  const planProgress = planItems.length ? Math.round((doneItems / planItems.length) * 100) : 0;

  const netHistory = (student.net_history ?? []).slice(-6);
  const examChart = (examSessions ?? []).slice().reverse().map((es: any) => ({
    date: es.taken_at, tyt_net: es.net ?? 0, ayt_net: 0, exam_name: es.exam_name,
  }));
  const chartData = examChart.length > 0 ? examChart : netHistory;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{greeting()}, {student.profile?.full_name?.split(" ")[0] ?? "Öğrenci"}!</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Hedef Alan" value={student.target_field ? FIELD_LABELS[student.target_field] : "Belirsiz"} icon={Target} />
        <StatCard label="Hedef Net" value={student.target_score ?? "-"} icon={TrendingUp} />
        <StatCard label="Bekleyen Ödev" value={pendingHomework} icon={ClipboardList} />
        <StatCard label="Bu Hafta Plan İlerlemesi" value={`%${planProgress}`} icon={CalendarDays} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Aboneliğim</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {subscription ? (
            <>
              <div>
                <p className="font-medium">{subscription.package?.name ?? "Paket"}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.status === "active" ? "Aktif abonelik" : "Ödeme bekleniyor"}
                  {subscription.ends_at && ` · Bitiş: ${formatDate(subscription.ends_at)}`}
                </p>
              </div>
              <Badge variant={subscription.status === "active" ? "success" : "secondary"}>
                {subscription.status === "active" ? "Aktif" : "Ödeme Bekliyor"}
              </Badge>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Aktif bir aboneliğiniz yok.</p>
              <a href="/paketler" className="text-sm font-medium text-primary hover:underline">
                Paketlere göz at →
              </a>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Net Gelişimi</CardTitle>
            <CardDescription>Son denemelerindeki TYT/AYT net değişimi</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <NetProgressChart data={chartData} />
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kaynak Önerileri</CardTitle>
            <CardDescription>Koçunun senin için önerdiği kaynaklar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(resources ?? []).length === 0 && <p className="text-sm text-muted-foreground">Henüz kaynak önerisi yok.</p>}
            {(resources ?? []).map((r: any) => (
              <div key={r.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.title}</p>
                  {r.subject && <Badge variant="secondary">{r.subject}</Badge>}
                </div>
                {r.note && <p className="mt-1 text-xs text-muted-foreground">{r.note}</p>}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Koç: {r.coach?.full_name}</span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-primary hover:underline">
                      İncele →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Seminerler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(seminars ?? []).length === 0 && <p className="text-sm text-muted-foreground">Yaklaşan seminer bulunmuyor.</p>}
            {(seminars ?? []).map((sem: any) => (
              <div key={sem.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{sem.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(sem.scheduled_at)}</p>
                {sem.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{sem.description}</p>}
                {sem.join_url && (
                  <a href={sem.join_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                    Seminere Katıl →
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
