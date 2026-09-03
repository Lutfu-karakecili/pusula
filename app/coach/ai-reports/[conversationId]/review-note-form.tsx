"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import { Loader2, Save } from "lucide-react";

export function ReviewNoteForm({ conversationId, coachId, reviewed }: {
  conversationId: string; coachId: string; reviewed: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingNotes, setExistingNotes] = useState<any[]>([]);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const supabase = createClient();
    const { data } = await supabase.from("ai_review_notes").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: false });
    setExistingNotes(data ?? []);
  }

  async function saveNote() {
    if (!note.trim()) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("ai_review_notes").insert({ conversation_id: conversationId, coach_id: coachId, note });
    await supabase.from("ai_conversations").update({ reviewed_by_coach: true, coach_reviewed_at: new Date().toISOString() }).eq("id", conversationId);
    setNote("");
    setLoading(false);
    fetchNotes();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Değerlendirmeni buraya yaz..." rows={3} className="flex-1" />
        <Button variant="gradient" onClick={saveNote} disabled={loading || !note.trim()} className="self-end">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        </Button>
      </div>
      {existingNotes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Önceki Notlar:</p>
          {existingNotes.map((n) => (
            <div key={n.id} className="rounded-lg border border-border p-3">
              <p className="text-sm">{n.note}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
