"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import type { Profile, Student, Homework } from "@/lib/types";
import {
  Search,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";

export default function StudentHomeworkPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setStudent(studentData);

      if (studentData) {
        const { data: hw } = await supabase
          .from("homework")
          .select("*")
          .eq("student_id", studentData.id)
          .order("due_date", { ascending: true });
        setHomework(hw || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  const updateStatus = async (id: string, newStatus: Homework["status"]) => {
    await supabase.from("homework").update({ status: newStatus }).eq("id", id);
    setHomework((prev) =>
      prev.map((hw) => (hw.id === id ? { ...hw, status: newStatus } : hw))
    );
  };

  const subjects = useMemo(
    () => [...new Set(homework.map((h) => h.subject))],
    [homework]
  );

  const filtered = useMemo(() => {
    return homework.filter((hw) => {
      const matchSearch =
        !search ||
        hw.title.toLowerCase().includes(search.toLowerCase()) ||
        hw.subject.toLowerCase().includes(search.toLowerCase());
      const matchSubject =
        subjectFilter === "all" || hw.subject === subjectFilter;
      return matchSearch && matchSubject;
    });
  }, [homework, search, subjectFilter]);

  const grouped = useMemo(() => {
    return {
      overdue: filtered.filter((h) => h.status === "overdue"),
      pending: filtered.filter((h) => h.status === "pending"),
      in_progress: filtered.filter((h) => h.status === "in_progress"),
      completed: filtered.filter((h) => h.status === "completed"),
    };
  }, [filtered]);

  const statusConfig = {
    overdue: {
      label: "Gecikmiş",
      color: "destructive" as const,
      icon: AlertCircle,
      gradient: "from-red-600/20 to-rose-600/20 border-red-500/20",
    },
    pending: {
      label: "Bekliyor",
      color: "warning" as const,
      icon: Clock,
      gradient: "from-amber-600/20 to-orange-600/20 border-amber-500/20",
    },
    in_progress: {
      label: "Devam Ediyor",
      color: "info" as const,
      icon: BookOpen,
      gradient: "from-blue-600/20 to-cyan-600/20 border-blue-500/20",
    },
    completed: {
      label: "Tamamlandı",
      color: "success" as const,
      icon: CheckCircle2,
      gradient: "from-emerald-600/20 to-green-600/20 border-emerald-500/20",
    },
  };

  const HomeworkCard = ({ hw }: { hw: Homework }) => {
    const cfg = statusConfig[hw.status];
    const Icon = cfg.icon;

    return (
      <div
        className={`p-4 bg-gradient-to-r ${cfg.gradient} border rounded-xl`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Icon className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{hw.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {hw.subject}
              </p>
              {hw.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {hw.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>Teslim: {formatDate(hw.due_date)}</span>
                <Badge variant={hw.priority === "high" ? "destructive" : hw.priority === "medium" ? "warning" : "secondary"}>
                  {hw.priority === "high" ? "Yüksek" : hw.priority === "medium" ? "Orta" : "Düşük"}
                </Badge>
              </div>
              {hw.score !== null && hw.score !== undefined && (
                <div className="mt-2">
                  <Badge variant="success">Puan: {hw.score}</Badge>
                </div>
              )}
              {hw.feedback && (
                <p className="mt-2 text-sm italic text-muted-foreground">
                  &ldquo;{hw.feedback}&rdquo;
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {hw.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateStatus(hw.id, "in_progress")}
              >
                Başla
              </Button>
            )}
            {hw.status === "in_progress" && (
              <Button
                size="sm"
                onClick={() => updateStatus(hw.id, "completed")}
              >
                Tamamla
              </Button>
            )}
            {hw.status === "overdue" && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateStatus(hw.id, "in_progress")}
              >
                Devam Et
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <DashboardLayout role="student" userName={profile?.full_name || "Öğrenci"}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Ödevlerim</h1>
          <p className="text-muted-foreground">
            Ödevlerini takip et ve durumunu güncelle
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ödev veya ders ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={subjectFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSubjectFilter("all")}
            >
              <Filter className="h-4 w-4 mr-1" /> Tümü
            </Button>
            {subjects.map((s) => (
              <Button
                key={s}
                variant={subjectFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setSubjectFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Homework Tabs */}
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="overdue">
              Gecikmiş ({grouped.overdue.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Bekliyor ({grouped.pending.length})
            </TabsTrigger>
            <TabsTrigger value="in_progress">
              Devam ({grouped.in_progress.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Tamamlandı ({grouped.completed.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Tümü ({filtered.length})
            </TabsTrigger>
          </TabsList>

          {(["overdue", "pending", "in_progress", "completed", "all"] as const).map(
            (tab) => (
              <TabsContent key={tab} value={tab} className="space-y-3">
                {tab === "all" ? (
                  filtered.length > 0 ? (
                    filtered.map((hw) => <HomeworkCard key={hw.id} hw={hw} />)
                  ) : (
                    <EmptyState />
                  )
                ) : grouped[tab].length > 0 ? (
                  grouped[tab].map((hw) => <HomeworkCard key={hw.id} hw={hw} />)
                ) : (
                  <EmptyState />
                )}
              </TabsContent>
            )
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
      <p className="text-sm">Bu kategoride ödev bulunmuyor</p>
    </div>
  );
}
