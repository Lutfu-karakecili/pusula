import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { CoachApplicationActions } from "./coach-application-actions";

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  pending: { label: "Bekliyor", variant: "secondary" },
  reviewed: { label: "İncelendi", variant: "default" },
  accepted: { label: "Kabul Edildi", variant: "success" },
  rejected: { label: "Reddedildi", variant: "destructive" },
};

export default async function CoachApplicationsPage() {
  await getCurrentProfile();
  const supabase = await createClient();

  const { data: applications } = await supabase
    .from("coach_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Koç Başvuruları</h1>

      {(applications ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Henüz başvuru bulunmuyor.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(applications ?? []).map((app: any) => (
            <Card key={app.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{app.full_name}</p>
                      <Badge variant={STATUS_LABEL[app.status]?.variant}>{STATUS_LABEL[app.status]?.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{app.email} · {app.phone}</p>
                    {app.university && <p className="text-xs text-muted-foreground">{app.university} — {app.department}</p>}
                    {app.exam_rank && <p className="text-xs text-muted-foreground">Sıralama: {app.exam_rank.toLocaleString()}</p>}
                    {app.motivation_note && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{app.motivation_note}"</p>}
                    {app.cv_url && (
                      <a href={app.cv_url} target="_blank" className="text-xs font-medium text-primary hover:underline">
                        CV'yi Görüntüle →
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDate(app.created_at)}</p>
                  </div>
                  <CoachApplicationActions applicationId={app.id} currentStatus={app.status} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
