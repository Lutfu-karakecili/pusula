import { getCurrentStudent } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { HomeworkSubmitButton } from "./submit-button";

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  pending: { label: "Bekliyor", variant: "secondary" },
  submitted: { label: "Teslim Edildi", variant: "default" },
  reviewed: { label: "Değerlendirildi", variant: "success" },
  late: { label: "Gecikti", variant: "destructive" },
};

export default async function StudentHomeworkPage() {
  const student = await getCurrentStudent();
  const supabase = await createClient();

  const { data: homework } = await supabase
    .from("homework")
    .select("*")
    .eq("student_id", student.id)
    .order("due_date", { ascending: true });

  return (
    <div className="space-y-4">
      {(homework ?? []).length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Henüz ödev atanmadı.</CardContent></Card>
      )}
      {(homework ?? []).map((h) => (
        <Card key={h.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">{h.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{h.subject} · Son teslim: {formatDate(h.due_date)}</p>
            </div>
            <Badge variant={STATUS_LABEL[h.status].variant}>{STATUS_LABEL[h.status].label}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {h.description && <p className="text-sm text-muted-foreground">{h.description}</p>}
            {h.coach_feedback && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-xs font-semibold text-muted-foreground">Koç Geri Bildirimi</p>
                <p>{h.coach_feedback}</p>
                {h.score != null && <p className="mt-1 text-xs font-medium text-primary">Puan: {h.score}</p>}
              </div>
            )}
            {(h.status === "pending" || h.status === "late") && <HomeworkSubmitButton homeworkId={h.id} />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
