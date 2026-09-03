"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Seminar {
  id: string; title: string; description: string | null; scheduled_at: string; join_url: string | null;
}

export function SeminarAdmin() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Seminar | null>(null);
  const [form, setForm] = useState({ title: "", description: "", scheduled_at: "", join_url: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("seminars").select("*").order("scheduled_at", { ascending: false });
    setSeminars((data ?? []) as Seminar[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ title: "", description: "", scheduled_at: "", join_url: "" });
    setDialogOpen(true);
  }

  function openEdit(s: Seminar) {
    setEditing(s);
    setForm({
      title: s.title,
      description: s.description ?? "",
      scheduled_at: s.scheduled_at?.slice(0, 16) ?? "",
      join_url: s.join_url ?? "",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title || !form.scheduled_at) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: form.title,
      description: form.description || null,
      scheduled_at: form.scheduled_at,
      join_url: form.join_url || null,
    };

    if (editing) {
      await supabase.from("seminars").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("seminars").insert(payload);
    }

    setSaving(false);
    setDialogOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu semineri silmek istediğinize emin misiniz?")) return;
    const supabase = createClient();
    await supabase.from("seminars").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gelişim Seminerleri</h1>
        <Button variant="gradient" onClick={openCreate}><Plus className="h-4 w-4" /> Yeni Seminer</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : seminars.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Henüz seminer yok.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {seminars.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{s.title}</p>
                    <Badge variant={new Date(s.scheduled_at) > new Date() ? "success" : "secondary"}>
                      {new Date(s.scheduled_at) > new Date() ? "Yaklaşan" : "Geçmiş"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDateTime(s.scheduled_at)}</p>
                  {s.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{s.description}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Semineri Düzenle" : "Yeni Seminer"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Tarih & Saat</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Katılım Linki</Label>
              <Input value={form.join_url} onChange={(e) => setForm({ ...form, join_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Vazgeç</Button>
            <Button variant="gradient" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
