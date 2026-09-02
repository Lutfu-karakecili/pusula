"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Video } from "lucide-react";

export function ScheduleMeetingForm({ students }: { students: { id: string; profile: { full_name: string } }[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [title, setTitle] = useState("Koçluk Görüşmesi");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(45);
  const [agenda, setAgenda] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!studentId || !scheduledAt) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ student_id: studentId, title, scheduled_at: new Date(scheduledAt).toISOString(), duration_minutes: duration, agenda }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Görüşme oluşturulamadı.");
      setLoading(false);
      return;
    }

    setScheduledAt(""); setAgenda("");
    setLoading(false);
    router.refresh();
  }

  if (students.length === 0) return <p className="text-sm text-muted-foreground">Henüz sana atanmış öğrenci yok.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Öğrenci</Label>
        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
          {students.map((s) => <option key={s.id} value={s.id}>{s.profile.full_name}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Başlık</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Tarih / Saat</Label>
        <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Süre (dk)</Label>
        <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Gündem</Label>
        <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={2} />
      </div>
      {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <Button variant="gradient" onClick={submit} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />} Zoom Görüşmesi Planla
        </Button>
      </div>
    </div>
  );
}
