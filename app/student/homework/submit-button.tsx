"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2 } from "lucide-react";

export function HomeworkSubmitButton({ homeworkId }: { homeworkId: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit() {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("homework")
      .update({ status: "submitted", submitted_at: new Date().toISOString(), submission_note: note })
      .eq("id", homeworkId);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="gradient" onClick={() => setOpen(true)}>
        <CheckCircle2 className="h-4 w-4" /> Teslim Et
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Teslim notu (opsiyonel)..." rows={2} />
      <div className="flex gap-2">
        <Button size="sm" variant="gradient" onClick={submit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Onayla
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
      </div>
    </div>
  );
}
