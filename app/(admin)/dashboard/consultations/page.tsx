import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ConsultationActions } from "./consultation-actions";

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  pending: { label: "Bekliyor", variant: "secondary" },
  contacted: { label: "İletişime Geçildi", variant: "default" },
  completed: { label: "Tamamlandı", variant: "success" },
  cancelled: { label: "İptal", variant: "destructive" },
};

export default async function ConsultationsPage() {
  await getCurrentProfile();
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("consultation_bookings")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ücretsiz Görüşme Talepleri</h1>

      {(bookings ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Henüz talep bulunmuyor.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(bookings ?? []).map((b: any) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-medium">{b.full_name}</p>
                    <p className="text-sm text-muted-foreground">{b.email} · {b.phone}</p>
                    {b.preferred_date && (
                      <p className="text-xs text-muted-foreground">
                        Tercih: {formatDate(b.preferred_date)}{b.preferred_time ? ` ${b.preferred_time}` : ""}
                      </p>
                    )}
                    {b.note && <p className="text-xs text-muted-foreground mt-1 italic">"{b.note}"</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_LABEL[b.status]?.variant}>{STATUS_LABEL[b.status]?.label}</Badge>
                    <ConsultationActions bookingId={b.id} currentStatus={b.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
