"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { initials, FIELD_LABELS } from "@/lib/utils";

interface CoachOption { id: string; full_name: string; }
interface StudentRow {
  id: string; target_field: string | null; grade: string | null; coach_id: string | null;
  profile: { full_name: string; email: string };
  coach?: { full_name: string } | null;
}

export function StudentsTable() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [coaches, setCoaches] = useState<CoachOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

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
          <div className="flex items-center gap-2">
            {savingId === s.id && <Loader2 className="h-4 w-4 animate-spin" />}
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
