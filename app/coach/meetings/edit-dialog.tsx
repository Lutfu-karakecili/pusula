"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface Meeting {
  id: string; title: string; scheduled_at: string; duration_minutes: number; agenda: string;
}

export function EditMeetingDialog({ meeting, open, onOpenChange }: {
  meeting: Meeting; open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(meeting.title);
  const [scheduledAt, setScheduledAt] = useState(meeting.scheduled_at?.slice(0, 16) ?? "");
  const [duration, setDuration] = useState(meeting.duration_minutes?.toString() ?? "30");
  const [agenda, setAgenda] = useState(meeting.agenda ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("meetings").update({
      title, scheduled_at: scheduledAt, duration_minutes: Number(duration), agenda,
    }).eq("id", meeting.id);
    setLoading(false);
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Görüşmeyi Düzenle</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Başlık</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tarih & Saat</Label>
            <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Süre (dakika)</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Gündem</Label>
            <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Vazgeç</Button>
          <Button variant="gradient" onClick={save} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
