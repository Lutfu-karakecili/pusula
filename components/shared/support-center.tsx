"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/utils";
import { Plus, LifeBuoy, Loader2, Upload } from "lucide-react";

const ISSUE_TYPES = ["Teknik Sorun", "Ödeme", "Hesap", "Diğer"];
const STATUS_MAP: Record<string, { label: string; variant: any }> = {
  open: { label: "Açık", variant: "secondary" },
  in_progress: { label: "İşleniyor", variant: "default" },
  resolved: { label: "Çözüldü", variant: "success" },
  closed: { label: "Kapatıldı", variant: "outline" },
};

interface Ticket {
  id: string; ticket_no: string; issue_type: string; description: string;
  status: string; created_at: string; admin_response?: string; attachment_urls?: string[];
}

export function SupportCenter({ userId }: { userId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const supabase = createClient();
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    setTickets((data as any[]) ?? []);
    setLoading(false);
  }

  async function submitTicket() {
    if (!description.trim()) return;
    setSubmitting(true);
    const supabase = createClient();

    const urls: string[] = [];
    for (const file of files.slice(0, 3)) {
      if (file.size > 1024 * 1024) { alert(`${file.name} 1MB'dan büyük olamaz.`); setSubmitting(false); return; }
      const path = `${userId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("support-attachments").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("support-attachments").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }

    await supabase.from("support_tickets").insert({
      user_id: userId, issue_type: issueType, description, attachment_urls: urls,
    });

    setDescription(""); setFiles([]); setShowForm(false);
    setSubmitting(false);
    fetchTickets();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Destek Merkezi</h1>
        <Button variant="gradient" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Talep Oluştur
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <LifeBuoy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Bir sorun mu yaşıyorsunuz?</p>
            <p className="mt-1 text-sm text-muted-foreground">Destek ekibimiz size yardımcı olmaktan mutluluk duyar.</p>
            <Button variant="gradient" className="mt-4" onClick={() => setShowForm(true)}>Talep Oluştur</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="rounded-lg border border-border p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedTicket(t)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t.ticket_no} — {t.issue_type}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</p>
                </div>
                <Badge variant={STATUS_MAP[t.status]?.variant}>{STATUS_MAP[t.status]?.label}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
              {t.admin_response && (
                <div className="mt-2 rounded bg-muted p-2 text-xs">
                  <span className="font-medium">Yanıt:</span> {t.admin_response}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Yeni Destek Talebi</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sorun Türü</Label>
              <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Hata / Sorun Detayı</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Yaşadığınız sorunu detaylı açıklayın..." />
            </div>
            <div className="space-y-2">
              <Label>Dosyalar (opsiyonel, max 3, max 1MB)</Label>
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <label key={i} className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-input text-xs text-muted-foreground hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    {files[i] ? files[i].name.slice(0, 8) : `Dosya ${i + 1}`}
                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setFiles((prev) => { const n = [...prev]; n[i] = f; return n; });
                    }} />
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Vazgeç</Button>
            <Button variant="gradient" onClick={submitTicket} disabled={submitting || !description.trim()}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={(v) => { if (!v) setSelectedTicket(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedTicket.ticket_no}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedTicket.issue_type}</Badge>
                <Badge variant={STATUS_MAP[selectedTicket.status]?.variant}>{STATUS_MAP[selectedTicket.status]?.label}</Badge>
              </div>
              <p className="text-sm">{selectedTicket.description}</p>
              {selectedTicket.admin_response && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p className="font-medium mb-1">Yönetici Yanıtı:</p>
                  <p>{selectedTicket.admin_response}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
