import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { ScheduleMeetingForm } from "./schedule-form";

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  scheduled: { label: "Planlandı", variant: "secondary" },
  completed: { label: "Tamamlandı", variant: "success" },
  cancelled: { label: "İptal Edildi", variant: "destructive" },
  no_show: { label: "Katılım Olmadı", variant: "destructive" },
};

export default async function CoachMeetingsPage() {
  const coach = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: students }, { data: meetings }] = await Promise.all([
    supabase.from("students").select("id, profile:profiles!students_id_fkey(full_name)").eq("coach_id", coach.id),
    supabase.from("meetings").select("*, student:students(profile:profiles(full_name))").eq("coach_id", coach.id).order("scheduled_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Görüşme Planla</CardTitle></CardHeader>
        <CardContent>
          <ScheduleMeetingForm students={(students ?? []) as any} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Görüşmelerim</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(meetings ?? []).length === 0 && <p className="text-sm text-muted-foreground">Henüz görüşme planlanmadı.</p>}
          {(meetings ?? []).map((m: any) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{m.title} — {m.student?.profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(m.scheduled_at)}</p>
                {m.zoom_start_url && (
                  <a href={m.zoom_start_url} target="_blank" className="text-xs font-medium text-primary hover:underline">
                    Zoom'u başlat →
                  </a>
                )}
              </div>
              <Badge variant={STATUS_LABEL[m.status].variant}>{STATUS_LABEL[m.status].label}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
