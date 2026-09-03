"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate, formatDateTime, initials } from "@/lib/utils";
import { ClipboardList, CalendarDays, TrendingUp, Video } from "lucide-react";

interface LinkedStudent {
  id: string;
  full_name: string;
  grade?: string;
}

interface StudentData {
  plan?: any;
  homework: any[];
  net?: number;
  nextMeeting?: any;
  pendingHomework: number;
  planProgress: number;
  planTotal: number;
  planDone: number;
}

export function ParentDashboardClient({ initialStudents, initialData }: {
  initialStudents: LinkedStudent[];
  initialData: Record<string, StudentData>;
}) {
  const [students] = useState(initialStudents);
  const [data] = useState(initialData);
  const [selectedId, setSelectedId] = useState(initialStudents[0]?.id ?? "");

  const current = data[selectedId];

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-20 text-center space-y-3">
          <p className="text-lg font-semibold">Henüz öğrenci bağlantısı yok</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Çocuğunuzun ilerlemesini takip edebilmek için hesabınızın bir öğrenciyle bağlanması gerekir. Bu işlemi sistem yöneticisi gerçekleştirir.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Veli Paneli</h1>
      <p className="text-sm text-muted-foreground">Çocuğunuzun eğitim sürecini yakından takip edin. Bu görünüm salt-okunurdur.</p>

      {students.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Öğrenci Seç</p>
            <div className="flex flex-wrap gap-2">
              {students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${selectedId === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">{initials(s.full_name)}</AvatarFallback>
                  </Avatar>
                  {s.full_name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedId && current && (
        <>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{initials(students.find((s) => s.id === selectedId)?.full_name ?? "")}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{students.find((s) => s.id === selectedId)?.full_name}</p>
              {(students.find((s) => s.id === selectedId) as any)?.grade && (
                <p className="text-sm text-muted-foreground">{(students.find((s) => s.id === selectedId) as any).grade}. Sınıf</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Bekleyen Ödev" value={current.pendingHomework} icon={ClipboardList} />
            <StatCard label="Haftalık Plan İlerlemesi" value={`%${current.planProgress}`} icon={CalendarDays} />
            <StatCard label="Son Deneme Neti" value={current.net ?? "-"} icon={TrendingUp} />
            <StatCard label="Yaklaşan Görüşme" value={current.nextMeeting ? formatDate(current.nextMeeting.scheduled_at, { day: "2-digit", month: "short" }) : "-"} icon={Video} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Haftalık Plan</CardTitle>
                <CardDescription>{current.plan ? formatDate(current.plan.week_start) : "Aktif plan yok"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress value={current.planProgress} />
                <p className="text-sm text-muted-foreground">
                  {current.planDone}/{current.planTotal} görev tamamlandı
                </p>
                {current.plan?.weekly_goal && <p className="text-sm text-muted-foreground italic">"{current.plan.weekly_goal}"</p>}
                {(current.plan?.plan_items ?? []).slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span>{item.subject} — {item.topic}</span>
                    <Badge variant={item.status === "done" ? "success" : "secondary"}>
                      {item.status === "done" ? "Tamamlandı" : item.status === "in_progress" ? "Devam" : "Bekliyor"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bekleyen Ödevler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(current.homework ?? []).length === 0 && <p className="text-sm text-muted-foreground">Ödev bulunmuyor.</p>}
                {(current.homework ?? []).slice(0, 6).map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <span>{h.title}</span>
                    <Badge variant={h.status === "reviewed" ? "success" : h.status === "late" ? "destructive" : "secondary"}>
                      {h.status === "reviewed" ? "Tamamlandı" : h.status === "late" ? "Gecikti" : formatDate(h.due_date, { day: "2-digit", month: "short", year: undefined })}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {current.nextMeeting && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Video className="h-4 w-4" /> Yaklaşan Görüşme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium">{current.nextMeeting.title}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(current.nextMeeting.scheduled_at)}</p>
                  {current.nextMeeting.zoom_join_url && (
                    <a href={current.nextMeeting.zoom_join_url} target="_blank" className="text-xs font-medium text-primary hover:underline">
                      Zoom'a katıl →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
