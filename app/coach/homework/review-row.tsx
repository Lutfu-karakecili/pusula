"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; variant: any }> = {
  pending: { label: "Bekliyor", variant: "secondary" },
  submitted: { label: "Teslim Edildi", variant: "default" },
  reviewed: { label: "Değerlendirildi", variant: "success" },
  late: { label: "Gecikti", variant: "destructive" },
};

export function HomeworkReviewRow({ homework }: { homework: any }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(homework.coach_feedback ?? "");
  const [score, setScore] = useState(homework.score?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function saveReview() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("homework").update({
      coach_feedback: feedback, score: score ? Number(score) : null, status: "reviewed",
    }).eq("id", homework.id);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{homework.title}</p>
          <p className="text-xs text-muted-foreground">{homework.student?.profile?.full_name} · {formatDate(homework.due_date)}</p>
        </div>
        <Badge variant={STATUS_LABEL[homework.status].variant}>{STATUS_LABEL[homework.status].label}</Badge>
      </div>
      {homework.status === "submitted" && !open && (
        <Button size="sm" variant="outline" className="mt-2" onClick={() => setOpen(true)}>Değerlendir</Button>
      )}
      {open && (
        <div className="mt-3 space-y-2">
          <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Geri bildirim..." rows={2} />
          <Input type="number" placeholder="Puan (0-100)" value={score} onChange={(e) => setScore(e.target.value)} className="w-32" />
          <div className="flex gap-2">
            <Button size="sm" variant="gradient" onClick={saveReview} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />} Kaydet
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
          </div>
        </div>
      )}
    </div>
  );
}
