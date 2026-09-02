"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

interface Item {
  subject: string; topic: string; exam_type: "TYT" | "AYT"; target_question_count: number; day_of_week: number;
}

export function PlanBuilder({ students, coachId }: { students: { id: string; profile: { full_name: string } }[]; coachId: string }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState<Item>({ subject: "", topic: "", exam_type: "TYT", target_question_count: 20, day_of_week: 1 });
  const [loading, setLoading] = useState(false);

  function addItem() {
    if (!draft.subject || !draft.topic) return;
    setItems((prev) => [...prev, draft]);
    setDraft({ ...draft, subject: "", topic: "" });
  }

  async function savePlan() {
    if (!studentId || items.length === 0) return;
    setLoading(true);
    const supabase = createClient();

    const { data: plan, error } = await supabase
      .from("plans")
      .upsert({ student_id: studentId, coach_id: coachId, week_start: weekStart, title: "Haftalık Çalışma Planı" }, { onConflict: "student_id,week_start" })
      .select()
      .single();

    if (!error && plan) {
      await supabase.from("plan_items").insert(items.map((it) => ({ ...it, plan_id: plan.id })));
      setItems([]);
      router.refresh();
    }
    setLoading(false);
  }

  if (students.length === 0) return <p className="text-sm text-muted-foreground">Henüz sana atanmış öğrenci yok.</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Öğrenci</Label>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            {students.map((s) => <option key={s.id} value={s.id}>{s.profile.full_name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Hafta Başlangıcı</Label>
          <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        </div>
      </div>

      <div className="rounded-lg border border-border p-4">
        <p className="mb-3 text-sm font-medium">Konu Ekle</p>
        <div className="grid gap-3 sm:grid-cols-5">
          <Input placeholder="Ders (Matematik)" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
          <Input placeholder="Konu (Türev)" value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} />
          <select value={draft.exam_type} onChange={(e) => setDraft({ ...draft, exam_type: e.target.value as "TYT" | "AYT" })} className="h-10 rounded-lg border border-input bg-background px-2 text-sm">
            <option value="TYT">TYT</option>
            <option value="AYT">AYT</option>
          </select>
          <Input type="number" placeholder="Soru sayısı" value={draft.target_question_count} onChange={(e) => setDraft({ ...draft, target_question_count: Number(e.target.value) })} />
          <select value={draft.day_of_week} onChange={(e) => setDraft({ ...draft, day_of_week: Number(e.target.value) })} className="h-10 rounded-lg border border-input bg-background px-2 text-sm">
            {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
          </select>
        </div>
        <Button size="sm" variant="outline" className="mt-3" onClick={addItem}>
          <Plus className="h-4 w-4" /> Listeye Ekle
        </Button>
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
              <span>{DAYS[it.day_of_week - 1]} · {it.subject} — {it.topic} <Badge variant="outline" className="ml-2">{it.exam_type}</Badge></span>
              <button onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          ))}
        </div>
      )}

      <Button variant="gradient" onClick={savePlan} disabled={loading || items.length === 0}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Planı Kaydet
      </Button>
    </div>
  );
}
