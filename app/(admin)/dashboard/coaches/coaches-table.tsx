"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

interface CoachRow {
  id: string; full_name: string; email: string; students: { id: string }[];
}

export function CoachesTable() {
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/coaches")
      .then((r) => r.json())
      .then((j) => setCoaches(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;

  return (
    <div className="space-y-2">
      {coaches.length === 0 && <p className="text-sm text-muted-foreground">Henüz koç eklenmedi. "Kullanıcılar" sayfasından rolü "Koç" olan bir hesap oluşturabilirsin.</p>}
      {coaches.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9"><AvatarFallback>{initials(c.full_name)}</AvatarFallback></Avatar>
            <div>
              <p className="text-sm font-medium">{c.full_name}</p>
              <p className="text-xs text-muted-foreground">{c.email}</p>
            </div>
          </div>
          <Badge variant="secondary">{c.students?.length ?? 0} öğrenci</Badge>
        </div>
      ))}
    </div>
  );
}
