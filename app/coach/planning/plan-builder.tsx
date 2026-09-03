"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Save, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAYS_FULL = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

const PRIORITY_OPTIONS = [
  { value: "onemli", label: "Önemli", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { value: "cok_onemli", label: "Çok Önemli", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  { value: "ekstra", label: "Ekstra", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
];

interface Row {
  cells: (string | null)[];  // 7 gün, her hücrede görev metni
  priority: string;
  startTime: string;
}

export function PlanBuilder({ students, coachId }: { students: { id: string; profile: { full_name: string } }[]; coachId: string }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState(new Date().toISOString().slice(0, 10));
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [showTimes, setShowTimes] = useState(false);
  const [loading, setLoading] = useState(false);

  const [rows, setRows] = useState<Row[]>([
    { cells: Array(7).fill(""), priority: "onemli", startTime: "09:00" },
  ]);

  function addRow() {
    setRows((prev) => [...prev, { cells: Array(7).fill(""), priority: "onemli", startTime: "09:00" }]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateCell(rowIdx: number, dayIdx: number, value: string) {
    setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, cells: r.cells.map((c, j) => j === dayIdx ? value : c) } : r));
  }

  function updateRowField(rowIdx: number, field: keyof Row, value: string) {
    setRows((prev) => prev.map((r, i) => i === rowIdx ? { ...r, [field]: value } : r));
  }

  async function savePlan() {
    if (!studentId) return;
    const nonEmpty = rows.filter((r) => r.cells.some((c) => c?.trim()));
    if (nonEmpty.length === 0) return;

    setLoading(true);
    const supabase = createClient();

    const { data: plan, error } = await supabase
      .from("plans")
      .upsert({ student_id: studentId, coach_id: coachId, week_start: weekStart, title: "Haftalık Çalışma Planı", weekly_goal: weeklyGoal || null }, { onConflict: "student_id,week_start" })
      .select()
      .single();

    if (error || !plan) { setLoading(false); return; }

    // Delete old items for this plan
    await supabase.from("plan_items").delete().eq("plan_id", plan.id);

    const itemsToInsert: any[] = [];
    nonEmpty.forEach((row, rowIdx) => {
      row.cells.forEach((cell, dayIdx) => {
        if (cell?.trim()) {
          itemsToInsert.push({
            plan_id: plan.id,
            subject: cell.trim(),
            topic: "",
            exam_type: "TYT",
            target_question_count: 0,
            day_of_week: dayIdx + 1,
            priority: row.priority,
            start_time: showTimes ? row.startTime : null,
            task_order: rowIdx + 1,
          });
        }
      });
    });

    if (itemsToInsert.length > 0) {
      await supabase.from("plan_items").insert(itemsToInsert);
    }

    setLoading(false);
    router.refresh();
  }

  if (students.length === 0) return <p className="text-sm text-muted-foreground">Henüz sana atanmış öğrenci yok.</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
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
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showTimes} onChange={(e) => setShowTimes(e.target.checked)} className="rounded border-input" />
            <Clock className="h-4 w-4" /> Saatleri Aktifleştir
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Haftalık Hedef / Motivasyon Notu</Label>
        <Textarea value={weeklyGoal} onChange={(e) => setWeeklyGoal(e.target.value)} placeholder="Bu hafta TYT matematik konularını bitirmeyi hedefliyorum..." rows={2} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="p-2 text-left text-xs font-medium text-muted-foreground w-24">Görev</th>
              {DAYS.map((d) => (
                <th key={d} className="p-2 text-center text-xs font-medium text-muted-foreground min-w-[120px]">{d}</th>
              ))}
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border last:border-0">
                <td className="p-2 space-y-1">
                  <select value={row.priority} onChange={(e) => updateRowField(rowIdx, "priority", e.target.value)} className="w-full rounded border border-input bg-background px-1 py-1 text-xs">
                    {PRIORITY_OPTIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  {showTimes && (
                    <Input type="time" value={row.startTime} onChange={(e) => updateRowField(rowIdx, "startTime", e.target.value)} className="h-7 text-xs" />
                  )}
                </td>
                {row.cells.map((cell, dayIdx) => (
                  <td key={dayIdx} className="p-1">
                    <textarea
                      value={cell ?? ""}
                      onChange={(e) => updateCell(rowIdx, dayIdx, e.target.value)}
                      placeholder={DAYS_FULL[dayIdx]}
                      rows={2}
                      className="w-full resize-none rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                ))}
                <td className="p-2 text-center">
                  {rows.length > 1 && (
                    <button onClick={() => removeRow(rowIdx)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={addRow}><Plus className="h-4 w-4" /> Satır Ekle</Button>
        <Button variant="gradient" onClick={savePlan} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Planı Kaydet
        </Button>
      </div>
    </div>
  );
}
