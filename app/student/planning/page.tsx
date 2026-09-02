import { getCurrentStudent } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export default async function StudentPlanningPage() {
  const student = await getCurrentStudent();
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("plans")
    .select("*, plan_items(*)")
    .eq("student_id", student.id)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  const items = (plan?.plan_items ?? []) as any[];
  const byDay = DAYS.map((_, i) => items.filter((it) => it.day_of_week === i + 1));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{plan?.title ?? "Haftalık Çalışma Planı"}</CardTitle>
          <CardDescription>{plan ? `Hafta başlangıcı: ${formatDate(plan.week_start)}` : "Koçun henüz senin için bir plan oluşturmadı."}</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DAYS.map((day, i) => (
          <Card key={day}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{day}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {byDay[i].length === 0 && <p className="text-xs text-muted-foreground">Konu atanmadı</p>}
              {byDay[i].map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-gradient-card p-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{item.subject}</p>
                    <Badge variant="outline" className="text-[10px]">{item.exam_type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.topic}</p>
                  <p className="mt-1 text-[11px] font-medium text-primary">{item.target_question_count} soru hedefi</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
