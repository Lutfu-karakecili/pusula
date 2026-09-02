"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus } from "lucide-react";

export function HomeworkAssignForm({ students, coachId }: { students: { id: string; profile: { full_name: string } }[]; coachId: string }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!studentId || !title || !subject || !dueDate) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("homework").insert({
      student_id: studentId, coach_id: coachId, title, subject, description, due_date: dueDate, status: "pending",
    });
    setTitle(""); setSubject(""); setDescription(""); setDueDate("");
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
        <Label>Ders</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Matematik" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Başlık</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Türev — 30 Soru" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label>Açıklama</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="space-y-2">
        <Label>Son Teslim Tarihi</Label>
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div className="flex items-end">
        <Button variant="gradient" onClick={submit} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Ödev Ata
        </Button>
      </div>
    </div>
  );
}
