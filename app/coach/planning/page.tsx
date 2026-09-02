"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";
import { cn, formatDate, getWeekNumber } from "@/lib/utils";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  Loader2,
  ChevronDown,
  BookOpen,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  GripVertical,
} from "lucide-react";

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface Subject {
  name: string;
  hours: number;
  topics: string[];
}

interface Plan {
  id: string;
  student_id: string;
  coach_id: string;
  week_start: string;
  title: string;
  description: string;
  subjects: Subject[];
  status: "active" | "completed" | "cancelled";
  created_at: string;
  student?: Student;
}

const statusConfig = {
  active: {
    label: "Aktif",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  completed: {
    label: "Tamamlandı",
    icon: CheckCircle2,
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  cancelled: {
    label: "İptal",
    icon: XCircle,
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

export default function PlanningPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    student_id: "",
    week_start: "",
    title: "",
    description: "",
    subjects: [{ name: "", hours: 1, topics: [""] }] as Subject[],
    status: "active" as "active" | "completed" | "cancelled",
  });

  const fetchPlans = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("plans")
      .select("*, student:student_id(full_name, email)")
      .eq("coach_id", user.id)
      .order("week_start", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }
    if (filterStudent !== "all") {
      query = query.eq("student_id", filterStudent);
    }

    const { data } = await query;
    setPlans(data || []);
  }, [filterStatus, filterStudent]);

  const fetchStudents = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("student_coach")
      .select("student:student_id(id, full_name, email)")
      .eq("coach_id", user.id);

    if (data) {
      const studentList = data
        .map((d: any) => d.student)
        .filter(Boolean) as Student[];
      setStudents(studentList);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPlans(), fetchStudents()]).then(() => setLoading(false));
  }, [fetchPlans, fetchStudents]);

  const resetForm = () => {
    setFormData({
      student_id: "",
      week_start: "",
      title: "",
      description: "",
      subjects: [{ name: "", hours: 1, topics: [""] }],
      status: "active",
    });
    setEditingPlan(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (plan: Plan) => {
    setFormData({
      student_id: plan.student_id,
      week_start: plan.week_start,
      title: plan.title,
      description: plan.description || "",
      subjects: plan.subjects?.length ? plan.subjects : [{ name: "", hours: 1, topics: [""] }],
      status: plan.status,
    });
    setEditingPlan(plan);
    setShowModal(true);
  };

  const addSubject = () => {
    setFormData({
      ...formData,
      subjects: [...formData.subjects, { name: "", hours: 1, topics: [""] }],
    });
  };

  const removeSubject = (index: number) => {
    if (formData.subjects.length <= 1) return;
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((_, i) => i !== index),
    });
  };

  const updateSubject = (index: number, field: keyof Subject, value: any) => {
    const updated = [...formData.subjects];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, subjects: updated });
  };

  const addTopic = (subjectIndex: number) => {
    const updated = [...formData.subjects];
    updated[subjectIndex].topics = [...updated[subjectIndex].topics, ""];
    setFormData({ ...formData, subjects: updated });
  };

  const removeTopic = (subjectIndex: number, topicIndex: number) => {
    const updated = [...formData.subjects];
    if (updated[subjectIndex].topics.length <= 1) return;
    updated[subjectIndex].topics = updated[subjectIndex].topics.filter(
      (_, i) => i !== topicIndex
    );
    setFormData({ ...formData, subjects: updated });
  };

  const updateTopic = (subjectIndex: number, topicIndex: number, value: string) => {
    const updated = [...formData.subjects];
    updated[subjectIndex].topics[topicIndex] = value;
    setFormData({ ...formData, subjects: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const cleanedSubjects = formData.subjects
      .filter((s) => s.name.trim())
      .map((s) => ({
        ...s,
        topics: s.topics.filter((t) => t.trim()),
      }));

    const payload = {
      student_id: formData.student_id,
      coach_id: user.id,
      week_start: formData.week_start,
      title: formData.title,
      description: formData.description,
      subjects: cleanedSubjects,
      status: formData.status,
    };

    if (editingPlan) {
      await supabase.from("plans").update(payload).eq("id", editingPlan.id);
    } else {
      await supabase.from("plans").insert(payload);
    }

    setShowModal(false);
    resetForm();
    fetchPlans();
    setSubmitting(false);
  };

  const handleDelete = async (planId: string) => {
    await supabase.from("plans").delete().eq("id", planId);
    setDeleteConfirm(null);
    fetchPlans();
  };

  const handleStatusChange = async (planId: string, newStatus: string) => {
    await supabase.from("plans").update({ status: newStatus }).eq("id", planId);
    fetchPlans();
  };

  const filteredPlans = plans.filter((plan) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      plan.title.toLowerCase().includes(q) ||
      plan.student?.full_name?.toLowerCase().includes(q) ||
      plan.description?.toLowerCase().includes(q)
    );
  });

  const totalHours = (subjects: Subject[]) =>
    subjects.reduce((sum, s) => sum + (s.hours || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-400" />
                Haftalık Planlar
              </h1>
              <p className="text-slate-400 mt-1">
                Öğrencileriniz için haftalık çalışma planları oluşturun
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all"
            >
              <Plus className="w-5 h-5" />
              Yeni Plan
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Plan ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="active">Aktif</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                className="pl-4 pr-8 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="all">Tüm Öğrenciler</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="text-center py-20 gradient-card rounded-xl">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">Henüz plan oluşturulmamış</p>
              <p className="text-slate-600 mt-1">
                "Yeni Plan" butonuna tıklayarak başlayın
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPlans.map((plan) => {
                const config = statusConfig[plan.status];
                const StatusIcon = config.icon;
                const weekEnd = new Date(plan.week_start);
                weekEnd.setDate(weekEnd.getDate() + 6);

                return (
                  <div
                    key={plan.id}
                    className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-4 md:p-6 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {plan.title}
                          </h3>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                              config.className
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {getWeekNumber(new Date(plan.week_start))} Hafta
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatDate(plan.week_start)} - {formatDate(weekEnd)}
                          </span>
                          {plan.student && (
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4" />
                              {plan.student.full_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            {totalHours(plan.subjects || [])} saat
                          </span>
                        </div>

                        {plan.description && (
                          <p className="text-slate-400 text-sm mb-3 line-clamp-2">
                            {plan.description}
                          </p>
                        )}

                        {plan.subjects && plan.subjects.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {plan.subjects.map((sub, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50 text-xs text-slate-300"
                              >
                                <GripVertical className="w-3 h-3 text-slate-600" />
                                {sub.name}
                                <span className="text-purple-400 font-medium">
                                  {sub.hours}sa
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {plan.status === "active" && (
                          <select
                            value={plan.status}
                            onChange={(e) =>
                              handleStatusChange(plan.id, e.target.value)
                            }
                            className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="active">Aktif</option>
                            <option value="completed">Tamamla</option>
                            <option value="cancelled">İptal Et</option>
                          </select>
                        )}
                        <button
                          onClick={() => openEditModal(plan)}
                          className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-purple-400 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === plan.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(plan.id)}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(plan.id)}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700 shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
                <h2 className="text-xl font-bold text-white">
                  {editingPlan ? "Planı Düzenle" : "Yeni Plan Oluştur"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Öğrenci
                    </label>
                    <select
                      value={formData.student_id}
                      onChange={(e) =>
                        setFormData({ ...formData, student_id: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      required
                    >
                      <option value="">Öğrenci seçin</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Hafta Başlangıç
                    </label>
                    <input
                      type="date"
                      value={formData.week_start}
                      onChange={(e) =>
                        setFormData({ ...formData, week_start: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Plan Başlığı
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Örn: TYT Hazırlık - 12. Hafta"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                    rows={2}
                    placeholder="Plan hakkında notlar..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">
                      Dersler
                    </label>
                    <button
                      type="button"
                      onClick={addSubject}
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Ders Ekle
                    </button>
                  </div>

                  {formData.subjects.map((subject, si) => (
                    <div
                      key={si}
                      className="rounded-lg bg-slate-800/30 border border-slate-700/50 p-4 space-y-3"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-slate-600" />
                        <input
                          type="text"
                          value={subject.name}
                          onChange={(e) =>
                            updateSubject(si, "name", e.target.value)
                          }
                          className="flex-1 px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Ders adı"
                        />
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={subject.hours}
                          onChange={(e) =>
                            updateSubject(si, "hours", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-3 py-1.5 rounded bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 text-center"
                          placeholder="Saat"
                        />
                        {formData.subjects.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSubject(si)}
                            className="p-1.5 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 pl-6">
                        {subject.topics.map((topic, ti) => (
                          <div key={ti} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={topic}
                              onChange={(e) =>
                                updateTopic(si, ti, e.target.value)
                              }
                              className="flex-1 px-3 py-1.5 rounded bg-slate-900/50 border border-slate-700/50 text-white text-xs placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="Konu adı"
                            />
                            {subject.topics.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeTopic(si, ti)}
                                className="p-1 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addTopic(si)}
                          className="text-[11px] text-slate-500 hover:text-purple-400 transition-colors"
                        >
                          + Konu ekle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {editingPlan && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Durum
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      <option value="active">Aktif</option>
                      <option value="completed">Tamamlandı</option>
                      <option value="cancelled">İptal</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingPlan ? (
                      "Güncelle"
                    ) : (
                      "Oluştur"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
