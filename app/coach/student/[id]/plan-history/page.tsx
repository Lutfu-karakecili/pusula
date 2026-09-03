import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/utils";
import { PlanHistoryActions } from "./plan-history-actions";

export default async function PlanHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, profile:profiles!students_id_fkey(full_name)")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const { data: plans } = await supabase
    .from("plans")
    .select("*, plan_items(*)")
    .eq("student_id", id)
    .order("week_start", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{(student.profile as any)?.full_name} — Plan Geçmişi</h1>
        <p className="text-sm text-muted-foreground">Tüm haftalık çalışma planları</p>
      </div>

      {(plans ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Henüz oluşturulmuş bir plan yok.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(plans ?? []).map((plan) => {
            const items = (plan.plan_items ?? []) as any[];
            const done = items.filter((i) => i.status === "done").length;
            const total = items.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <Card key={plan.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">
                      {formatDate(plan.week_start)} — {formatDate(new Date(new Date(plan.week_start).getTime() + 6 * 86400000))}
                    </CardTitle>
                    {plan.weekly_goal && <p className="mt-1 text-xs text-muted-foreground">{plan.weekly_goal}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={pct === 100 ? "success" : "secondary"}>{done}/{total} Görev · %{pct}</Badge>
                    <PlanHistoryActions planId={plan.id} studentId={id} />
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={pct} className="mb-3" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span>{item.subject} — {item.topic || "Genel"}</span>
                        <Badge variant={item.status === "done" ? "success" : "secondary"}>
                          {item.status === "done" ? "Tamamlandı" : item.status === "in_progress" ? "Devam" : "Bekliyor"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {items.length > 10 && <p className="mt-2 text-xs text-muted-foreground">+{items.length - 10} görev daha...</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
