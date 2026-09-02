"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { cn, formatDate, getWeekNumber, SUBJECTS } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Plan, SubjectPlan, Student, Profile } from "@/lib/types";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  GripVertical,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const statusConfig = {
  active: {
    label: "Aktif",
    variant: "success" as const,
    icon: CheckCircle2,
  },
  completed: {
    label: "Tamamlandı",
    variant: "info" as const,
    icon: CheckCircle2,
  },
  cancelled: {
    label: "İptal",
    variant: "destructive" as const,
    icon: XCircle,
  },
};

const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export default function PlanningPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const [formData, setFormData] = useState({
    student_id: "",
    week_start: "",
    title: "",
    description: "",
    subjects: [
      { subject: "", topics: [""], days: [0, 1, 2, 3, 4], duration_min: 60 },
    ] as SubjectPlan[],
    status: "active" as "active" | "completed" | "cancelled",
  });

  const getWeekStart = (offset: number) => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff + offset * 7);
    return monday.toISOString().split("T")[0];
  };

  const fetchPlans = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("plans")
      .select("*, student:students!plans_student_id_fkey(*, profiles!students_user_id_fkey(full_name, email))")
      .eq("coach_id", user.id)
      .order("week_start", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;
    setPlans((data as Plan[]) || []);
  }, [filterStatus]);

  const fetchStudents = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("students")
      .select("*, profiles!students_user_id_fkey(full_name, email)")
      .eq("coach_id", user.id);

    setStudents((data as Student[]) || []);
  }, []);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      await Promise.all([fetchPlans(), fetchStudents()]);
      setLoading(false);
    };
    init();
  }, [fetchPlans, fetchStudents]);

  const resetForm = () => {
    setFormData({
      student_id: "",
      week_start: getWeekStart(weekOffset),
      title: "",
      description: "",
      subjects: [
        { subject: "", topics: [""], days: [0, 1, 2, 3, 4], duration_min: 60 },
      ],
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
      subjects: plan.subjects?.length
        ? plan.subjects
        : [{ subject: "", topics: [""], days: [0, 1, 2, 3, 4], duration_min: 60 }],
      status: plan.status,
    });
    setEditingPlan(plan);
    setShowModal(true);
  };

  const addSubject = () => {
    setFormData({
      ...formData,
      subjects: [
        ...formData.subjects,
        { subject: "", topics: [""], days: [], duration_min: 60 },
      ],
    });
  };

  const removeSubject = (index: number) => {
    if (formData.subjects.length <= 1) return;
    setFormData({
      ...formData,
      subjects: formData.subjects.filter((_, i) => i !== index),
    });
  };

  const updateSubject = (
    index: number,
    field: keyof SubjectPlan,
    value: any
  ) => {
    const updated = [...formData.subjects];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, subjects: updated });
  };

  const toggleDay = (subjectIndex: number, day: number) => {
    const updated = [...formData.subjects];
    const days = updated[subjectIndex].days.includes(day)
      ? updated[subjectIndex].days.filter((d) => d !== day)
      : [...updated[subjectIndex].days, day].sort();
    updated[subjectIndex] = { ...updated[subjectIndex], days };
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

  const updateTopic = (
    subjectIndex: number,
    topicIndex: number,
    value: string
  ) => {
    const updated = [...formData.subjects];
    updated[subjectIndex].topics[topicIndex] = value;
    setFormData({ ...formData, subjects: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSubmitting(false);
      return;
    }

    const cleanedSubjects = formData.subjects
      .filter((s) => s.subject.trim())
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
    fetchPlans();
  };

  const handleStatusChange = async (planId: string, newStatus: string) => {
    await supabase
      .from("plans")
      .update({ status: newStatus })
      .eq("id", planId);
    fetchPlans();
  };

  const filteredPlans = plans.filter((plan) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      plan.title.toLowerCase().includes(q) ||
      plan.student?.profiles?.full_name?.toLowerCase().includes(q) ||
      plan.description?.toLowerCase().includes(q)
    );
  });

  const totalHours = (subjects: SubjectPlan[]) =>
    subjects.reduce((sum, s) => sum + Math.round(s.duration_min / 60), 0);

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Koç"}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-400" />
              Haftalık Planlar
            </h1>
            <p className="text-muted-foreground mt-1">
              Öğrencileriniz için haftalık çalışma planları oluşturun
            </p>
          </div>
          <Button onClick={openCreateModal} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Plan
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Plan ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Tüm Durumlar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="completed">Tamamlandı</SelectItem>
              <SelectItem value="cancelled">İptal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset(weekOffset - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium">
            {getWeekNumber(new Date(getWeekStart(weekOffset)))}. Hafta
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset(weekOffset + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredPlans.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                Henüz plan oluşturulmamış
              </p>
              <p className="text-muted-foreground/70 mt-1">
                "Yeni Plan" butonuna tıklayarak başlayın
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPlans.map((plan) => {
              const config = statusConfig[plan.status];
              const StatusIcon = config.icon;
              const weekEnd = new Date(plan.week_start);
              weekEnd.setDate(weekEnd.getDate() + 6);

              return (
                <Card
                  key={plan.id}
                  className="hover:border-indigo-500/30 transition-all"
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold truncate">
                            {plan.title}
                          </h3>
                          <Badge variant={config.variant}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {getWeekNumber(new Date(plan.week_start))} Hafta
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatDate(plan.week_start)} -{" "}
                            {formatDate(weekEnd)}
                          </span>
                          {plan.student?.profiles && (
                            <span className="flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4" />
                              {plan.student.profiles.full_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <GripVertical className="w-4 h-4" />
                            {totalHours(plan.subjects || [])} saat
                          </span>
                        </div>

                        {plan.description && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {plan.description}
                          </p>
                        )}

                        {plan.subjects && plan.subjects.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {plan.subjects.map((sub, i) => (
                              <Badge key={i} variant="secondary">
                                {sub.subject}
                                <span className="ml-1 text-indigo-400">
                                  {Math.round(sub.duration_min / 60)}sa
                                </span>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {plan.status === "active" && (
                          <Select
                            value={plan.status}
                            onValueChange={(v: string) =>
                              handleStatusChange(plan.id, v)
                            }
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Aktif</SelectItem>
                              <SelectItem value="completed">
                                Tamamla
                              </SelectItem>
                              <SelectItem value="cancelled">
                                İptal Et
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(plan)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Planı Düzenle" : "Yeni Plan Oluştur"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Öğrenci</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(v: string) =>
                    setFormData({ ...formData, student_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Öğrenci seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.profiles?.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hafta Başlangıç</Label>
                <Input
                  type="date"
                  value={formData.week_start}
                  onChange={(e) =>
                    setFormData({ ...formData, week_start: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Plan Başlığı</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Örn: TYT Hazırlık - 12. Hafta"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                placeholder="Plan hakkında notlar..."
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Dersler</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSubject}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Ders Ekle
                </Button>
              </div>

              {formData.subjects.map((subject, si) => (
                <Card key={si} className="bg-muted/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <Select
                        value={subject.subject}
                        onValueChange={(v: string) =>
                          updateSubject(si, "subject", v)
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Ders seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="15"
                        step="15"
                        value={subject.duration_min}
                        onChange={(e) =>
                          updateSubject(
                            si,
                            "duration_min",
                            parseInt(e.target.value) || 60
                          )
                        }
                        className="w-20 text-center"
                        placeholder="dk"
                      />
                      {formData.subjects.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubject(si)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 pl-6">
                      {DAY_NAMES.map((day, di) => (
                        <Button
                          key={di}
                          type="button"
                          variant={subject.days.includes(di) ? "default" : "outline"}
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => toggleDay(si, di)}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-2 pl-6">
                      {subject.topics.map((topic, ti) => (
                        <div key={ti} className="flex items-center gap-2">
                          <Input
                            value={topic}
                            onChange={(e) =>
                              updateTopic(si, ti, e.target.value)
                            }
                            className="text-xs"
                            placeholder="Konu adı"
                          />
                          {subject.topics.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTopic(si, ti)}
                              className="h-6 w-6"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addTopic(si)}
                        className="text-xs h-7"
                      >
                        + Konu ekle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {editingPlan && (
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v: string) =>
                    setFormData({
                      ...formData,
                      status: v as "active" | "completed" | "cancelled",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="completed">Tamamlandı</SelectItem>
                    <SelectItem value="cancelled">İptal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {editingPlan ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
