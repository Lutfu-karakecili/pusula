"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CATEGORIES = [
  { value: "genel", label: "Genel" },
  { value: "motivasyon", label: "Motivasyon" },
  { value: "akademik", label: "Akademik" },
  { value: "davranis", label: "Davranış" },
  { value: "aile", label: "Aile" },
];

export function NoteForm({ studentId, coachId }: { studentId: string; coachId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("genel");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!content.trim()) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("coaching_notes").insert({
      student_id: studentId,
      coach_id: coachId,
      content,
      category,
      visible_to_student: visible,
    });
    setContent("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Öğrenci hakkında değerlendirme notu yaz..." rows={3} />
      <div className="flex flex-wrap items-center gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm">
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
          Öğrenciye görünür olsun
        </label>
        <Button size="sm" variant="gradient" onClick={submit} disabled={loading} className="ml-auto">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Not Ekle
        </Button>
      </div>
    </div>
  );
}
