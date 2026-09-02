"use client";

import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";
import { cn, formatDate } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Homework {
  id: string;
  student_id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  score: number | null;
  feedback: string | null;
  created_at: string;
}

const subjects = [
  "Matematik",
  "Türkçe",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Tarih",
  "Coğrafya",
  "Felsefe",
  "İngilizce",
  "Genel",
];

const statusConfig = {
  pending: {
    label: "Bekliyor",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  in_progress: {
    label: "Devam Ediyor",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Play,
  },
  completed: {
    label: "Tamamlandı",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  overdue: {
    label: "Gecikmiş",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: AlertTriangle,
  },
};

const priorityConfig = {
  low: { label: "Düşük", color: "text-slate-400", dot: "bg-slate-400" },
  medium: { label: "Orta", color: "text-amber-400", dot: "bg-amber-400" },
  high: { label: "Yüksek", color: "text-red-400", dot: "bg-red-400" },
};

const statusGroups: { key: Homework["status"]; label: string; gradient: string }[] = [
  { key: "overdue", label: "Gecikmiş", gradient: "from-red-600 to-red-500" },
  { key: "pending", label: "Bekleyen Ödevler", gradient: "from-amber-600 to-orange-500" },
  { key: "in_progress", label: "Devam Eden Ödevler", gradient: "from-blue-600 to-cyan-500" },
  { key: "completed", label: "Tamamlanan Ödevler", gradient: "from-emerald-600 to-green-500" },
];

export default function StudentHomeworkPage() {
  const supabase = createClient();

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string>("");

  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    overdue: true,
    pending: true,
    in_progress: true,
    completed: false,
  });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (studentId) fetchHomeworks();
  }, [filterSubject, filterStatus]);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!student) {
      setLoading(false);
      return;
    }

    setStudentId(student.id);
    await fetchHomeworks(student.id);
  };

  const fetchHomeworks = async (sid?: string) => {
    setLoading(true);
    const id = sid || studentId;
    if (!id) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from("homework")
      .select("*")
      .eq("student_id", id)
      .order("due_date", { ascending: false });

    if (filterSubject !== "all") {
      query = query.eq("subject", filterSubject);
    }
    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;

    const now = new Date();
    const enriched = (data || []).map((hw: Homework) => {
      if (hw.status !== "completed") {
        const due = new Date(hw.due_date);
        if (due < now) return { ...hw, status: "overdue" as const };
      }
      return hw;
    });

    setHomeworks(enriched);
    setLoading(false);
  };

  const filteredHomeworks = homeworks.filter((hw) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      hw.title.toLowerCase().includes(q) ||
      hw.description.toLowerCase().includes(q) ||
      hw.subject.toLowerCase().includes(q)
    );
  });

  const grouped = statusGroups
    .map((group) => ({
      ...group,
      items: filteredHomeworks.filter((hw) => hw.status === group.key),
    }))
    .filter((group) => group.items.length > 0 || filterStatus === group.key);

  const stats = {
    total: homeworks.length,
    pending: homeworks.filter((h) => h.status === "pending").length,
    in_progress: homeworks.filter((h) => h.status === "in_progress").length,
    completed: homeworks.filter((h) => h.status === "completed").length,
    overdue: homeworks.filter((h) => h.status === "overdue").length,
  };

  const handleStatusChange = async (id: string, status: Homework["status"]) => {
    const { error } = await supabase.from("homework").update({ status }).eq("id", id);
    if (!error) {
      await fetchHomeworks();
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                <BookOpen className="w-6 h-6 text-indigo-400" />
              </div>
              Ödevlerim
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Ödevlerini takip et ve tamamla
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="gradient-card p-4">
              <p className="text-xs text-slate-400">Toplam</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-950/60 to-amber-900/40 border border-amber-500/20 rounded-xl p-4">
              <p className="text-xs text-amber-400/70">Bekleyen</p>
              <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-950/60 to-blue-900/40 border border-blue-500/20 rounded-xl p-4">
              <p className="text-xs text-blue-400/70">Devam Eden</p>
              <p className="text-2xl font-bold text-blue-400">{stats.in_progress}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-950/60 to-emerald-900/40 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-xs text-emerald-400/70">Tamamlanan</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.completed}</p>
            </div>
            <div className="bg-gradient-to-br from-red-950/60 to-red-900/40 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs text-red-400/70">Gecikmiş</p>
              <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ödev ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
                  showFilters
                    ? "bg-purple-600/20 border-purple-500/30 text-purple-400"
                    : "bg-slate-900/60 border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600"
                )}
              >
                <Filter className="w-4 h-4" />
                Filtrele
              </button>
            </div>

            {showFilters && (
              <div className="gradient-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Durum</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="all">Tüm Durumlar</option>
                    {Object.entries(statusConfig).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Ders</label>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="all">Tüm Dersler</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : filteredHomeworks.length === 0 ? (
            <div className="text-center py-20 gradient-card">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-lg">Ödev bulunamadı</p>
              <p className="text-slate-600 text-sm mt-1">
                {searchQuery || filterSubject !== "all" || filterStatus !== "all"
                  ? "Filtreleri değiştirerek tekrar deneyin"
                  : "Koçunuz henüz ödev eklemedi"}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => {
                const GroupIcon = statusConfig[group.key].icon;
                const isExpanded = expandedGroups[group.key] !== false;

                return (
                  <div key={group.key} className="space-y-3">
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-800/60 hover:border-slate-700/60 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-1.5 rounded-lg bg-gradient-to-br",
                            group.gradient,
                            "text-white"
                          )}
                        >
                          <GroupIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {group.label}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                          {group.items.length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-3 pl-0 md:pl-4">
                        {group.items.map((hw) => {
                          const sc = statusConfig[hw.status];
                          const pc = priorityConfig[hw.priority];
                          const daysLeft = getDaysUntilDue(hw.due_date);

                          return (
                            <div
                              key={hw.id}
                              className="gradient-card p-4 md:p-5 hover:border-purple-500/30 transition-all group"
                            >
                              <div className="flex flex-col md:flex-row md:items-start gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-white text-base">
                                      {hw.title}
                                    </h3>
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
                                        sc.color
                                      )}
                                    >
                                      <StatusIcon status={hw.status} />
                                      {sc.label}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs font-medium">
                                      <span
                                        className={cn("w-1.5 h-1.5 rounded-full", pc.dot)}
                                      />
                                      <span className={pc.color}>{pc.label}</span>
                                    </span>
                                  </div>

                                  {hw.description && (
                                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                                      {hw.description}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatDate(hw.due_date)}
                                      {hw.status !== "completed" && (
                                        <span
                                          className={cn(
                                            "ml-1 font-medium",
                                            daysLeft < 0
                                              ? "text-red-400"
                                              : daysLeft <= 2
                                                ? "text-amber-400"
                                                : "text-slate-500"
                                          )}
                                        >
                                          {daysLeft < 0
                                            ? `(${Math.abs(daysLeft)} gün gecikti)`
                                            : daysLeft === 0
                                              ? "(Bugün)"
                                              : `(${daysLeft} gün kaldı)`}
                                        </span>
                                      )}
                                    </span>
                                    <span className="bg-slate-800/60 px-2 py-0.5 rounded-md">
                                      {hw.subject}
                                    </span>
                                  </div>

                                  {hw.status === "completed" && hw.score !== null && (
                                    <div className="mt-3 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-2">
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                          <Star className="w-3.5 h-3.5 text-emerald-400" />
                                          <span className="text-sm font-bold text-emerald-400">
                                            {hw.score}
                                          </span>
                                          <span className="text-xs text-emerald-400/60">/100</span>
                                        </div>
                                        <ScoreBar score={hw.score} />
                                      </div>
                                      {hw.feedback && (
                                        <div className="flex items-start gap-2">
                                          <div className="w-0.5 h-4 rounded-full bg-emerald-500/30 mt-0.5 shrink-0" />
                                          <p className="text-sm text-slate-300">
                                            {hw.feedback}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex md:flex-col gap-2 shrink-0">
                                  {hw.status === "pending" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(hw.id, "in_progress")
                                      }
                                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-all"
                                    >
                                      <Play className="w-3 h-3" />
                                      Başlat
                                    </button>
                                  )}
                                  {hw.status === "in_progress" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(hw.id, "completed")
                                      }
                                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-all"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Tamamla
                                    </button>
                                  )}
                                  {hw.status === "overdue" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(hw.id, "in_progress")
                                      }
                                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-medium transition-all"
                                    >
                                      <Play className="w-3 h-3" />
                                      Başla
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusIcon({ status }: { status: Homework["status"] }) {
  const iconClass = "w-3 h-3";
  switch (status) {
    case "pending":
      return <Clock className={iconClass} />;
    case "in_progress":
      return <Play className={iconClass} />;
    case "completed":
      return <CheckCircle2 className={iconClass} />;
    case "overdue":
      return <AlertTriangle className={iconClass} />;
  }
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-400"
      : score >= 60
        ? "bg-amber-400"
        : "bg-red-400";

  return (
    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700", color)}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
}
