"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle, XCircle, ExternalLink, UserPlus } from "lucide-react";
import { initials, FIELD_LABELS } from "@/lib/utils";

interface CoachOption { id: string; full_name: string; }
interface StudentRow {
  id: string; target_field: string | null; grade: string | null; coach_id: string | null;
  verification_status: string; verification_document_url: string | null;
  profile: { full_name: string; email: string };
  coach?: { full_name: string } | null;
}

const VER_STATUS: Record<string, { label: string; variant: any }> = {
  missing: { label: "Belge Yok", variant: "destructive" },
  pending: { label: "Onay Bekliyor", variant: "secondary" },
  verified: { label: "Onaylandı", variant: "success" },
  rejected: { label: "Reddedildi", variant: "destructive" },
};

export function StudentsTable() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [parentEmailId, setParentEmailId] = useState<string | null>(null);
  const [parentEmail, setParentEmail] = useState("");
  const [addingParent, setAddingParent] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const [sRes, cRes] = await Promise.all([fetch("/api/admin/students"), fetch("/api/admin/coaches")]);
    const [sJson, cJson] = await Promise.all([sRes.json(), cRes.json()]);
    setStudents(sJson.data ?? []);
    setCoaches((cJson.data ?? []).map((c: any) => ({ id: c.id, full_name: c.full_name })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function assignCoach(studentId: string, coachId: string) {
    setSavingId(studentId);
    await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: studentId, coach_id: coachId || null }),
    });
    await load();
    setSavingId(null);
  }

  async function updateVerification(studentId: string, status: string) {
    setSavingId(studentId);
    await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: studentId, verification_status: status }),
    });
    await load();
    setSavingId(null);
  }

  async function addParent(studentId: string, email: string) {
    if (!email) return;
    setAddingParent(studentId);
    const res = await fetch("/api/admin/add-parent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ student_id: studentId, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Veli eklenemedi.");
    } else {
      alert("Veli hesabı oluşturuldu ve öğrenciyle bağlandı." + (data.password ? `\nGeçici şifre: ${data.password}` : ""));
    }
    setAddingParent(null);
    setParentEmailId(null);
    setParentEmail("");
    await load();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;

  return (
    <div className="space-y-2">
      {students.length === 0 && <p className="text-sm text-muted-foreground">Henüz öğrenci yok.</p>}
      {students.map((s) => (
        <div key={s.id} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9"><AvatarFallback>{initials(s.profile.full_name)}</AvatarFallback></Avatar>
            <div>
              <p className="text-sm font-medium">{s.profile.full_name}</p>
              <p className="text-xs text-muted-foreground">{s.profile.email}</p>
            </div>
            {s.target_field && <Badge variant="secondary">{FIELD_LABELS[s.target_field]}</Badge>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={VER_STATUS[s.verification_status]?.variant ?? "secondary"}>
              {VER_STATUS[s.verification_status]?.label ?? s.verification_status}
            </Badge>
            {s.verification_document_url && (
              <a href={s.verification_document_url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="h-4 w-4" /></Button>
              </a>
            )}
            {s.verification_status === "pending" && (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" disabled={savingId === s.id} onClick={() => updateVerification(s.id, "verified")}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" disabled={savingId === s.id} onClick={() => updateVerification(s.id, "rejected")}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
            {savingId === s.id && <Loader2 className="h-4 w-4 animate-spin" />}

            {parentEmailId === s.id ? (
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="Veli e-postası"
                  className="h-9 w-48"
                  autoFocus
                />
                <Button size="sm" variant="gradient" disabled={addingParent === s.id} onClick={() => addParent(s.id, parentEmail)}>
                  {addingParent === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Bağla"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setParentEmailId(null); setParentEmail(""); }}>Vazgeç</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={() => setParentEmailId(s.id)} title="Veli Ekle">
                <UserPlus className="h-4 w-4" /> Veli
              </Button>
            )}

            <select
              value={s.coach_id ?? ""}
              onChange={(e) => assignCoach(s.id, e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
            >
              <option value="">Koç atanmadı</option>
              {coaches.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
