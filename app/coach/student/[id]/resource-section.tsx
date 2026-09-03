"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Plus, Loader2, Trash2, ExternalLink } from "lucide-react";

export function ResourceSection({ studentId, coachId }: { studentId: string; coachId: string }) {
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("resource_recommendations")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    setResources(data ?? []);
  }

  useEffect(() => { load(); }, [studentId]);

  async function addResource() {
    if (!title) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("resource_recommendations").insert({
      student_id: studentId,
      coach_id: coachId,
      title,
      subject: subject || null,
      url: url || null,
      note: note || null,
    });
    setTitle(""); setSubject(""); setUrl(""); setNote("");
    setLoading(false);
    await load();
  }

  async function removeResource(id: string) {
    if (!confirm("Bu kaynak önerisini silmek istediğinize emin misiniz?")) return;
    const supabase = createClient();
    await supabase.from("resource_recommendations").delete().eq("id", id);
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kaynak Önerileri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Başlık</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Matematik Soru Bankası" />
          </div>
          <div className="space-y-2">
            <Label>Ders</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Matematik" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Link</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Not</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Öneri açıklaması..." />
          </div>
        </div>
        <Button variant="gradient" size="sm" onClick={addResource} disabled={loading || !title}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Kaynak Öner
        </Button>

        {resources.length > 0 && (
          <div className="space-y-2 pt-2">
            {resources.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">{r.title}</p>
                  {r.subject && <Badge variant="secondary" className="mt-1">{r.subject}</Badge>}
                  {r.note && <p className="text-xs text-muted-foreground mt-1">{r.note}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                      Git <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeResource(r.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
