"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleMeetingForm } from "./schedule-form";
import { EditMeetingDialog } from "./edit-dialog";
import { formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { deleteZoomMeeting } from "@/lib/zoom";
import { Search, Pencil, XCircle } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  scheduled: { label: "Planlandı", variant: "secondary" },
  completed: { label: "Tamamlandı", variant: "success" },
  cancelled: { label: "İptal Edildi", variant: "destructive" },
  no_show: { label: "Katılım Olmadı", variant: "destructive" },
};

interface Meeting {
  id: string; title: string; scheduled_at: string; status: string;
  duration_minutes: number; agenda: string; zoom_meeting_id?: string;
  zoom_start_url?: string; student?: { profile?: { full_name: string } };
}

export function MeetingsClient({ students, meetings }: {
  students: { id: string; profile: { full_name: string } }[];
  meetings: Meeting[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("upcoming");
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showForm, setShowForm] = useState(false);

  const now = new Date().toISOString();

  const filtered = useMemo(() => {
    let list = meetings;
    if (tab === "upcoming") list = list.filter((m) => m.status === "scheduled" && m.scheduled_at > now);
    else if (tab === "past") list = list.filter((m) => m.status === "completed" || m.scheduled_at < now);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.title.toLowerCase().includes(q) ||
        m.student?.profile?.full_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [meetings, tab, search, now]);

  const counts = useMemo(() => ({
    upcoming: meetings.filter((m) => m.status === "scheduled" && m.scheduled_at > now).length,
    past: meetings.filter((m) => m.status === "completed" || m.scheduled_at < now).length,
    all: meetings.length,
  }), [meetings, now]);

  async function cancelMeeting(m: Meeting) {
    if (!confirm(`"${m.title}" toplantısını iptal etmek istediğinize emin misiniz?`)) return;
    const supabase = createClient();
    await supabase.from("meetings").update({ status: "cancelled" }).eq("id", m.id);
    if (m.zoom_meeting_id) await deleteZoomMeeting(m.zoom_meeting_id).catch(() => {});
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Görüşme Planla</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Kapat" : "Yeni Görüşme"}
          </Button>
        </CardHeader>
        {showForm && (
          <CardContent>
            <ScheduleMeetingForm students={students} />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Görüşmelerim</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Öğrenci adı veya başlık ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="upcoming">Yaklaşanlar ({counts.upcoming})</TabsTrigger>
              <TabsTrigger value="past">Geçmiş ({counts.past})</TabsTrigger>
              <TabsTrigger value="all">Tümü ({counts.all})</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4 space-y-3">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Görüşme bulunamadı.</p>
              ) : filtered.map((m) => (
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
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_LABEL[m.status]?.variant}>{STATUS_LABEL[m.status]?.label}</Badge>
                    {m.status === "scheduled" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingMeeting(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => cancelMeeting(m)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {editingMeeting && (
        <EditMeetingDialog meeting={editingMeeting} open={!!editingMeeting} onOpenChange={(v) => { if (!v) setEditingMeeting(null); }} />
      )}
    </div>
  );
}
