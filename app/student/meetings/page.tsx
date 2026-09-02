import { getCurrentStudent } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  scheduled: { label: "Planlandı", variant: "secondary" },
  completed: { label: "Tamamlandı", variant: "success" },
  cancelled: { label: "İptal Edildi", variant: "destructive" },
  no_show: { label: "Katılım Olmadı", variant: "destructive" },
};

export default async function StudentMeetingsPage() {
  const student = await getCurrentStudent();
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*, coach:profiles!meetings_coach_id_fkey(full_name, avatar_url)")
    .eq("student_id", student.id)
    .order("scheduled_at", { ascending: false });

  return (
    <div className="space-y-4">
      {(meetings ?? []).length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Henüz görüşme planlanmadı.</CardContent></Card>
      )}
      {(meetings ?? []).map((m: any) => (
        <Card key={m.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-pusula text-white">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{m.title}</CardTitle>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {formatDateTime(m.scheduled_at)} · Koç: {m.coach?.full_name}
                </p>
              </div>
            </div>
            <Badge variant={STATUS_LABEL[m.status].variant}>{STATUS_LABEL[m.status].label}</Badge>
          </CardHeader>
          {(m.agenda || m.summary || m.zoom_join_url) && (
            <CardContent className="space-y-2">
              {m.agenda && <p className="text-sm"><span className="font-medium">Gündem:</span> {m.agenda}</p>}
              {m.summary && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Özet:</span> {m.summary}</p>}
              {m.zoom_join_url && m.status === "scheduled" && (
                <Button asChild variant="gradient" size="sm">
                  <a href={m.zoom_join_url} target="_blank" rel="noreferrer">
                    <Video className="h-4 w-4" /> Zoom'a Katıl
                  </a>
                </Button>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
