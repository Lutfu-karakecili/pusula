"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Plus, Loader2 } from "lucide-react";

export function ExamSessionForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [examName, setExamName] = useState("");
  const [takenAt, setTakenAt] = useState(new Date().toISOString().slice(0, 16));
  const [duration, setDuration] = useState("");
  const [correct, setCorrect] = useState("");
  const [wrong, setWrong] = useState("");
  const [blank, setBlank] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!examName) return;
    setLoading(true);
    const supabase = createClient();
    const total = Number(correct || 0) + Number(wrong || 0) + Number(blank || 0);
    const successRate = total > 0 ? Math.round((Number(correct || 0) / total) * 100 * 100) / 100 : null;
    await supabase.from("exam_sessions").insert({
      student_id: studentId,
      exam_name: examName,
      taken_at: takenAt,
      duration_minutes: duration ? Number(duration) : null,
      correct_count: Number(correct || 0),
      wrong_count: Number(wrong || 0),
      blank_count: Number(blank || 0),
      success_rate: successRate,
    });
    setLoading(false);
    setOpen(false);
    setExamName(""); setDuration(""); setCorrect(""); setWrong(""); setBlank("");
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Sonuç Ekle
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Sınav Sonucu</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sınav Adı</Label>
              <Input value={examName} onChange={(e) => setExamName(e.target.value)} placeholder="AYT Deneme 3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input type="datetime-local" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Süre (dk)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="180" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Doğru</Label>
                <Input type="number" value={correct} onChange={(e) => setCorrect(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Yanlış</Label>
                <Input type="number" value={wrong} onChange={(e) => setWrong(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Boş</Label>
                <Input type="number" value={blank} onChange={(e) => setBlank(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button variant="gradient" onClick={save} disabled={loading || !examName}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
