"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HomeworkAssignForm } from "./assign-form";
import { HomeworkReviewRow } from "./review-row";
import { Search, Plus } from "lucide-react";

interface HomeworkItem {
  id: string; title: string; subject: string; due_date: string; status: string;
  student?: { profile?: { full_name: string } };
}

export function HomeworkClient({ students, homework, coachId }: {
  students: { id: string; profile: { full_name: string } }[];
  homework: HomeworkItem[];
  coachId: string;
}) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [showAssign, setShowAssign] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    let list = homework;
    if (tab === "pending") list = list.filter((h) => h.status === "pending");
    else if (tab === "reviewed") list = list.filter((h) => h.status === "reviewed");
    else if (tab === "late") list = list.filter((h) => h.status !== "reviewed" && h.due_date < today);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((h) =>
        h.title.toLowerCase().includes(q) ||
        h.student?.profile?.full_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [homework, tab, search, today]);

  const counts = useMemo(() => ({
    all: homework.length,
    pending: homework.filter((h) => h.status === "pending").length,
    reviewed: homework.filter((h) => h.status === "reviewed").length,
    late: homework.filter((h) => h.status !== "reviewed" && h.due_date < today).length,
  }), [homework, today]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ödev Ata</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowAssign(!showAssign)}>
            {showAssign ? "Kapat" : <><Plus className="h-4 w-4" /> Yeni Ödev</>}
          </Button>
        </CardHeader>
        {showAssign && (
          <CardContent>
            <HomeworkAssignForm students={students} coachId={coachId} />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atanan Ödevler</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Öğrenci adı veya ödev başlığı ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">Tümü ({counts.all})</TabsTrigger>
              <TabsTrigger value="pending">Bekleyenler ({counts.pending})</TabsTrigger>
              <TabsTrigger value="reviewed">Tamamlananlar ({counts.reviewed})</TabsTrigger>
              <TabsTrigger value="late">Geç Kalanlar ({counts.late})</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">Henüz atanmış ödev yok.</p>
                  <Button variant="gradient" size="sm" className="mt-3" onClick={() => setShowAssign(true)}>
                    <Plus className="h-4 w-4" /> İlk Ödevi Ata
                  </Button>
                </div>
              ) : (
                filtered.map((h) => <HomeworkReviewRow key={h.id} homework={h} />)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
