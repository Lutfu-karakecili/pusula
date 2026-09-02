"use client";

import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";
import { cn, formatDate } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  X,
  ChevronDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Star,
  Loader2,
  Trash2,
  Send,
} from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Homework {
  id: string;
  student_id: string;
  coach_id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  score: number | null;
  feedback: string | null;
  created_at: string;
  student?: Student;
}

interface HomeworkForm {
  student_id: string;
  title: string;
  description: string;
  subject: string;
  due_date: string;
  priority: "low" | "medium" | "high";
}

interface FeedbackForm {
  score: string;
  feedback: string;
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
    icon: Loader2,
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
  low: { label: "Düşük", color: "text-slate-400" },
  medium: { label: "Orta", color: "text-amber-400" },
  high: { label: "Yüksek", color: "text-red-400" },
};

const emptyForm: HomeworkForm = {
  student_id: "",
  title: "",
  description: "",
  subject: "Genel",
  due_date: "",
  priority: "medium",
};

const emptyFeedback: FeedbackForm = {
  score: "",
  feedback: "",
};

export default function CoachHomeworkPage() {
  const supabase = createClient();

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string>("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  const [form, setForm] = useState<HomeworkForm>(emptyForm);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>(emptyFeedback);
  const [submitting, setSubmitting] = useState(false);

  const [filterStudent, setFilterStudent] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    fetchHomeworks();
  }, [filterStudent, filterStatus, filterSubject]);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCoachId(user.id);

    const { data: studentsData } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "student");

    setStudents(studentsData || []);
    await fetchHomeworks(user.id);
  };

  const fetchHomeworks = async (cid?: string) => {
    setLoading(true);
    const coachID = cid || coachId;
    if (!coachID) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from("homework")
      .select("*, student:profiles!homework_student_id_fkey(id, full_name, email)")
      .eq("coach_id", coachID)
      .order("created_at", { ascending: false });

    if (filterStudent !== "all") {
      query = query.eq("student_id", filterStudent);
    }
    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }
    if (filterSubject !== "all") {
      query = query.eq("subject", filterSubject);
    }

    const { data } = await query;
    setHomeworks((data as Homework[]) || []);
    setLoading(false);
  };

  const filteredHomeworks = homeworks.filter((hw) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      hw.title.toLowerCase().includes(q) ||
      hw.description.toLowerCase().includes(q) ||
      hw.student?.full_name?.toLowerCase().includes(q) ||
      hw.subject.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: homeworks.length,
    pending: homeworks.filter((h) => h.status === "pending").length,
    in_progress: homeworks.filter((h) => h.status === "in_progress").length,
    completed: homeworks.filter((h) => h.status === "completed").length,
    overdue: homeworks.filter((h) => h.status === "overdue").length,
  };

  const handleCreate = async () => {
    if (!form.student_id || !form.title || !form.due_date) return;
    setSubmitting(true);

    const { error } = await supabase.from("homework").insert({
      student_id: form.student_id,
      coach_id: coachId,
      title: form.title,
      description: form.description,
      subject: form.subject,
      due_date: form.due_date,
      priority: form.priority,
      status: "pending",
    });

    if (!error) {
      setShowCreateModal(false);
      setForm(emptyForm);
      await fetchHomeworks();
    }
    setSubmitting(false);
  };

  const handleUpdateFeedback = async () => {
    if (!selectedHomework) return;
    setSubmitting(true);

    const updateData: Record<string, unknown> = {};

    if (feedbackForm.score !== "") {
      updateData.score = parseInt(feedbackForm.score);
    }
    if (feedbackForm.feedback) {
      updateData.feedback = feedbackForm.feedback;
    }
    updateData.status = "completed";

    const { error } = await supabase
      .from("homework")
      .update(updateData)
      .eq("id", selectedHomework.id);

    if (!error) {
      setShowEditModal(false);
      setSelectedHomework(null);
      setFeedbackForm(emptyFeedback);
      await fetchHomeworks();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("homework").delete().eq("id", id);
    if (!error) {
      await fetchHomeworks();
    }
  };

  const handleStatusChange = async (id: string, status: Homework["status"]) => {
    const { error } = await supabase.from("homework").update({ status }).eq("id", id);
    if (!error) {
      await fetchHomeworks();
    }
  };

  const getStudentName = (studentId: string) => {
    return students.find((s) => s.id === studentId)?.full_name || "Bilinmeyen";
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                </div>
                Ödevler
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Ödevlerinizi yönetin ve geri bildirim verin
              </p>
            </div>
            <button
              onClick={() => {
                setForm(emptyForm);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" />
              Yeni Ödev
            </button>
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
              <div className="gradient-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Öğrenci</label>
                  <select
                    value={filterStudent}
                    onChange={(e) => setFilterStudent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="all">Tüm Öğrenciler</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
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
                Yeni bir ödev oluşturmak için butona tıklayın
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHomeworks.map((hw) => {
                const sc = statusConfig[hw.status];
                const pc = priorityConfig[hw.priority];
                const daysLeft = getDaysUntilDue(hw.due_date);
                const StatusIcon = sc.icon;

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
                            <StatusIcon className="w-3 h-3" />
                            {sc.label}
                          </span>
                          <span className={cn("text-xs font-medium", pc.color)}>
                            {hw.priority === "high" && "●"} {pc.label}
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
                                  "ml-1",
                                  daysLeft < 0
                                    ? "text-red-400"
                                    : daysLeft <= 2
                                    ? "text-amber-400"
                                    : "text-slate-500"
                                )}
                              >
                                {daysLeft < 0
                                  ? `${Math.abs(daysLeft)} gün gecikti`
                                  : daysLeft === 0
                                  ? "Bugün"
                                  : `${daysLeft} gün kaldı`}
                              </span>
                            )}
                          </span>
                          <span className="bg-slate-800/60 px-2 py-0.5 rounded-md">
                            {hw.subject}
                          </span>
                          <span>
                            {hw.student?.full_name || getStudentName(hw.student_id)}
                          </span>
                        </div>

                        {hw.score !== null && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                              <Star className="w-3 h-3 text-emerald-400" />
                              <span className="text-sm font-semibold text-emerald-400">
                                {hw.score}
                              </span>
                              <span className="text-xs text-emerald-400/60">/100</span>
                            </div>
                            {hw.feedback && (
                              <p className="text-xs text-slate-400 truncate max-w-xs">
                                {hw.feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2 shrink-0">
                        <select
                          value={hw.status}
                          onChange={(e) =>
                            handleStatusChange(hw.id, e.target.value as Homework["status"])
                          }
                          className="px-2 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                        >
                          {Object.entries(statusConfig).map(([key, val]) => (
                            <option key={key} value={key}>
                              {val.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setSelectedHomework(hw);
                            setFeedbackForm({
                              score: hw.score?.toString() || "",
                              feedback: hw.feedback || "",
                            });
                            setShowEditModal(true);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-medium transition-all"
                        >
                          <Edit3 className="w-3 h-3" />
                          Puan
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Bu ödevi silmek istediğinize emin misiniz?")) {
                              handleDelete(hw.id);
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg gradient-card p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Yeni Ödev Oluştur</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Öğrenci *</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                  <option value="">Öğrenci seçin</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Başlık *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ödev başlığı"
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ödev açıklaması..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Ders</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Öncelik</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as "low" | "medium" | "high",
                      })
                    }
                    className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Son Tarih *</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 rounded-xl text-sm font-medium transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !form.student_id || !form.title || !form.due_date}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Oluştur
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedHomework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg gradient-card p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Puan & Geri Bildirim</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedHomework(null);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
              <p className="text-sm font-medium text-white">{selectedHomework.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {selectedHomework.student?.full_name || getStudentName(selectedHomework.student_id)} — {selectedHomework.subject}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Puan (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={feedbackForm.score}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, score: e.target.value })}
                  placeholder="0-100 arası puan"
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Geri Bildirim</label>
                <textarea
                  value={feedbackForm.feedback}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, feedback: e.target.value })
                  }
                  placeholder="Öğrenciye geri bildiriminizi yazın..."
                  rows={4}
                  className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedHomework(null);
                }}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 rounded-xl text-sm font-medium transition-all"
              >
                İptal
              </button>
              <button
                onClick={handleUpdateFeedback}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
