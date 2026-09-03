import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export default async function CoachAIReportsPage() {
  const coach = await getCurrentProfile();
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, profile:profiles!students_id_fkey(full_name)")
    .eq("coach_id", coach.id);

  const studentIds = (students ?? []).map((s: any) => s.id);

  const { data: conversations } = studentIds.length > 0
    ? await supabase
        .from("ai_conversations")
        .select("*, student:students(profile:profiles!students_id_fkey(full_name)), ai_messages(id)")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Öğrenci AI Raporları</h1>
      <p className="text-sm text-muted-foreground">Öğrencilerinizin AI ile yaptığı sohbetleri inceleyebilirsiniz.</p>

      {(conversations ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Henüz incelenecek AI sohbeti yok.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(conversations ?? []).map((conv: any) => (
            <div key={conv.id} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">{conv.student?.profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{conv.title || "AI Sohbet"} · {conv.ai_messages?.length ?? 0} mesaj · {formatDate(conv.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={conv.reviewed_by_coach ? "success" : "secondary"}>
                  {conv.reviewed_by_coach ? "İncelendi" : "Bekliyor"}
                </Badge>
                <Link href={`/coach/ai-reports/${conv.id}`}>
                  <Button variant="outline" size="sm"><Eye className="h-4 w-4" /> İncele</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
