"use client";

import { createClient } from "@/lib/supabase";
import { cn, formatDate, SUBJECTS } from "@/lib/utils";
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
import { useEffect, useState } from "react";
import type { Homework, Student, Profile } from "@/lib/types";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  X,
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
  low: { label: "Düşük", color: "text-muted-foreground" },
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
  const [profile, setProfile] = useState<Profile | null>(null);

  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string>("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(
    null
  );

  const [form, setForm] = useState<HomeworkForm>(emptyForm);
  const [feedbackForm, setFeedbackForm] =
    useState<FeedbackForm>(emptyFeedback);
  const [submitting, setSubmitting] = useState(false);

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (coachId) fetchHomeworks();
  }, [filterStatus]);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCoachId(user.id);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);

    const { data: studentsData } = await supabase
      .from("students")
      .select("*, profiles!students_user_id_fkey(full_name, email)")
      .eq("coach_id", user.id);

    setStudents((studentsData as Student[]) || []);
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
      .select(
        "*, student:students!homework_student_id_fkey(*, profiles!students_user_id_fkey(full_name, email))"
      )
      .eq("coach_id", coachID)
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
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
      hw.description?.toLowerCase().includes(q) ||
      hw.student?.profiles?.full_name?.toLowerCase().includes(q) ||
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
    await supabase.from("homework").delete().eq("id", id);
    await fetchHomeworks();
  };

  const handleStatusChange = async (
    id: string,
    status: Homework["status"]
  ) => {
    await supabase.from("homework").update({ status }).eq("id", id);
    await fetchHomeworks();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil(
      (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Koç"}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                <BookOpen className="w-6 h-6 text-indigo-400" />
              </div>
              Ödevler
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Ödevlerinizi yönetin ve geri bildirim verin
            </p>
          </div>
          <Button
            onClick={() => {
              setForm(emptyForm);
              setShowCreateModal(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ödev
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Toplam</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-950/60 to-amber-900/40 border-amber-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-amber-400/70">Bekleyen</p>
              <p className="text-2xl font-bold text-amber-400">
                {stats.pending}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-950/60 to-blue-900/40 border-blue-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-blue-400/70">Devam Eden</p>
              <p className="text-2xl font-bold text-blue-400">
                {stats.in_progress}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-950/60 to-emerald-900/40 border-emerald-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-400/70">Tamamlanan</p>
              <p className="text-2xl font-bold text-emerald-400">
                {stats.completed}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-950/60 to-red-900/40 border-red-500/20">
            <CardContent className="p-4">
              <p className="text-xs text-red-400/70">Gecikmiş</p>
              <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ödev ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtrele
            </Button>
          </div>

          {showFilters && (
            <Card>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Durum</Label>
                  <Select
                    value={filterStatus}
                    onValueChange={setFilterStatus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm Durumlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <SelectItem key={key} value={key}>
                          {val.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredHomeworks.length === 0 ? (
          <Card className="text-center py-20">
            <CardContent>
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground text-lg">Ödev bulunamadı</p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                Yeni bir ödev oluşturmak için butona tıklayın
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredHomeworks.map((hw) => {
              const sc = statusConfig[hw.status];
              const pc = priorityConfig[hw.priority];
              const daysLeft = getDaysUntilDue(hw.due_date);
              const StatusIcon = sc.icon;

              return (
                <Card
                  key={hw.id}
                  className="hover:border-indigo-500/30 transition-all group"
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base">
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
                          <span
                            className={cn("text-xs font-medium", pc.color)}
                          >
                            {hw.priority === "high" && "●"} {pc.label}
                          </span>
                        </div>

                        {hw.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {hw.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
                                    : ""
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
                          <span className="bg-muted px-2 py-0.5 rounded-md">
                            {hw.subject}
                          </span>
                          <span>
                            {hw.student?.profiles?.full_name}
                          </span>
                        </div>

                        {hw.score !== null && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                              <Star className="w-3 h-3 text-emerald-400" />
                              <span className="text-sm font-semibold text-emerald-400">
                                {hw.score}
                              </span>
                              <span className="text-xs text-emerald-400/60">
                                /100
                              </span>
                            </div>
                            {hw.feedback && (
                              <p className="text-xs text-muted-foreground truncate max-w-xs">
                                {hw.feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex md:flex-col gap-2 shrink-0">
                        <Select
                          value={hw.status}
                          onValueChange={(v: string) =>
                            handleStatusChange(
                              hw.id,
                              v as Homework["status"]
                            )
                          }
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(
                              ([key, val]) => (
                                <SelectItem key={key} value={key}>
                                  {val.label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedHomework(hw);
                            setFeedbackForm({
                              score: hw.score?.toString() || "",
                              feedback: hw.feedback || "",
                            });
                            setShowEditModal(true);
                          }}
                          className="h-8"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Puan
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          onClick={() => handleDelete(hw.id)}
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

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Yeni Ödev Oluştur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Öğrenci *</Label>
              <Select
                value={form.student_id}
                onValueChange={(v: string) => setForm({ ...form, student_id: v })}
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
              <Label>Başlık *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Ödev başlığı"
              />
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Ödev açıklaması..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Ders</Label>
                <Select
                  value={form.subject}
                  onValueChange={(v: string) =>
                    setForm({ ...form, subject: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                    <SelectItem value="Genel">Genel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Öncelik</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v: string) =>
                    setForm({
                      ...form,
                      priority: v as "low" | "medium" | "high",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Düşük</SelectItem>
                    <SelectItem value="medium">Orta</SelectItem>
                    <SelectItem value="high">Yüksek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Son Tarih *</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) =>
                  setForm({ ...form, due_date: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              İptal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                submitting ||
                !form.student_id ||
                !form.title ||
                !form.due_date
              }
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Puan & Geri Bildirim</DialogTitle>
          </DialogHeader>

          {selectedHomework && (
            <>
              <div className="bg-muted/40 rounded-xl p-4 border">
                <p className="text-sm font-medium">
                  {selectedHomework.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedHomework.student?.profiles?.full_name} —{" "}
                  {selectedHomework.subject}
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Puan (0-100)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={feedbackForm.score}
                    onChange={(e) =>
                      setFeedbackForm({
                        ...feedbackForm,
                        score: e.target.value,
                      })
                    }
                    placeholder="0-100 arası puan"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Geri Bildirim</Label>
                  <Textarea
                    value={feedbackForm.feedback}
                    onChange={(e) =>
                      setFeedbackForm({
                        ...feedbackForm,
                        feedback: e.target.value,
                      })
                    }
                    placeholder="Öğrenciye geri bildiriminizi yazın..."
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedHomework(null);
                  }}
                >
                  İptal
                </Button>
                <Button
                  onClick={handleUpdateFeedback}
                  disabled={submitting}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Kaydet
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
