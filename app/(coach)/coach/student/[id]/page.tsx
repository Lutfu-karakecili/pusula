"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { cn, getInitials } from "@/lib/utils";
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
import type {
  Student,
  CoachingNote,
  Profile,
  ExamResult,
} from "@/lib/types";
import {
  ArrowLeft,
  Star,
  Target,
  TrendingUp,
  GraduationCap,
  Plus,
  Calendar,
  BookOpen,
  NotebookPen,
  Pencil,
  Trash2,
  Loader2,
  User,
} from "lucide-react";

const categoryMap: Record<
  CoachingNote["category"],
  { label: string; color: string }
> = {
  academic: {
    label: "Akademik",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/20",
  },
  behavioral: {
    label: "Davranış",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/20",
  },
  motivational: {
    label: "Motivasyon",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/20",
  },
  general: {
    label: "Genel",
    color: "bg-slate-500/20 text-slate-400 border-slate-500/20",
  },
};

export default function CoachStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [coachProfile, setCoachProfile] = useState<Profile | null>(null);
  const [notes, setNotes] = useState<CoachingNote[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<CoachingNote | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CoachingNote["category"]>(
    "general"
  );
  const [rating, setRating] = useState(0);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    loadStudent();
  }, [studentId]);

  const loadStudent = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setCoachProfile(data);
    }

    const { data: studentData } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", studentId)
      .single();

    if (studentData) {
      setStudent(studentData);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentData.user_id)
        .single();
      setProfile(profileData || null);
    }

    const { data: notesData } = await supabase
      .from("coaching_notes")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    setNotes((notesData as CoachingNote[]) || []);

    const { data: examsData } = await supabase
      .from("exam_results")
      .select("*")
      .eq("student_id", studentId)
      .order("exam_date", { ascending: false })
      .limit(5);

    setExamResults((examsData as ExamResult[]) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("general");
    setRating(0);
    setEditingNote(null);
    setShowForm(false);
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (note: CoachingNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setRating(note.rating || 0);
    setShowForm(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSavingNote(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingNote(false);
      return;
    }

    const payload = {
      student_id: studentId,
      coach_id: user.id,
      category,
      title: title.trim(),
      content: content.trim(),
      rating,
    };

    if (editingNote) {
      await supabase
        .from("coaching_notes")
        .update(payload)
        .eq("id", editingNote.id);
    } else {
      await supabase.from("coaching_notes").insert(payload);
    }

    setSavingNote(false);
    resetForm();
    loadStudent();
  };

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from("coaching_notes").delete().eq("id", noteId);
    loadStudent();
  };

  const scoreProgress =
    student?.target_score && student.current_score != null
      ? Math.min(
          100,
          Math.round(
            (student.current_score / student.target_score) * 100
          )
        )
      : 0;

  return (
    <DashboardLayout
      role="coach"
      userName={coachProfile?.full_name || "Koç"}
    >
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/coach/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>

        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : student ? (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-indigo-600/10 border-indigo-500/20">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shrink-0">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : profile?.full_name ? (
                      getInitials(profile.full_name)
                    ) : (
                      <User className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold">
                      {profile?.full_name || "Öğrenci"}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      {profile?.email}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                      {student.grade && (
                        <Badge variant="secondary">
                          <GraduationCap className="w-3 h-3 mr-1" />
                          Sınıf {student.grade}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-4 sm:mt-0">
                    <div className="text-center">
                      <p className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        {student.current_score ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mevccut Puan
                      </p>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-center">
                      <p className="text-3xl font-bold">
                        {student.target_score ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Hedef Puan
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Target className="w-4 h-4 text-indigo-400" />
                      Hedefe İlerleme
                    </span>
                    <span className="font-semibold">%{scoreProgress}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${scoreProgress}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card
                className="hover:border-indigo-500/40 transition-colors cursor-pointer"
                onClick={() =>
                  router.push(`/coach/planning?student=${studentId}`)
                }
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Plan Oluştur</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Haftalık plan hazırla
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="hover:border-blue-500/40 transition-colors cursor-pointer"
                onClick={() =>
                  router.push(`/coach/homework?student=${studentId}`)
                }
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Ödev Ekle</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ödev ataması yap
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="hover:border-emerald-500/40 transition-colors cursor-pointer"
                onClick={() =>
                  router.push(`/coach/meetings?student=${studentId}`)
                }
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold">Görüşme Planla</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Toplantı ayarla
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Performans Özeti
                </CardTitle>
              </CardHeader>
              <CardContent>
                {examResults.length === 0 ? (
                  <div className="h-48 rounded-xl bg-muted/20 border border-dashed flex items-center justify-center">
                    <div className="text-center">
                      <TrendingUp className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Henüz sınav sonucu yok
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {examResults.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {exam.exam_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(exam.exam_date).toLocaleDateString(
                              "tr-TR"
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-emerald-400">
                            +{exam.correct}
                          </span>
                          <span className="text-red-400">
                            -{exam.incorrect}
                          </span>
                          {exam.total_score != null && (
                            <span className="font-semibold">
                              {exam.total_score}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <NotebookPen className="w-5 h-5 text-indigo-400" />
                    Koçluk Notları
                  </CardTitle>
                  <Button
                    onClick={startCreate}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Not Ekle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showForm && (
                  <form
                    onSubmit={handleSaveNote}
                    className="mb-6 p-4 rounded-xl bg-muted/30 border space-y-4"
                  >
                    <div className="flex flex-wrap gap-2">
                      {(
                        Object.keys(categoryMap) as CoachingNote["category"][]
                      ).map((cat) => (
                        <Button
                          key={cat}
                          type="button"
                          variant={
                            category === cat ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCategory(cat)}
                          className={cn(
                            category === cat && categoryMap[cat].color
                          )}
                        >
                          {categoryMap[cat].label}
                        </Button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label>Başlık</Label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Not başlığı"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>İçerik</Label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={3}
                        placeholder="Not detayları"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Değerlendirme</Label>
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <Star
                              className={cn(
                                "w-6 h-6",
                                star <= rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              )}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-muted-foreground">
                          {rating > 0
                            ? `${rating}/5`
                            : "Puan ver"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={resetForm}
                      >
                        Vazgeç
                      </Button>
                      <Button
                        type="submit"
                        disabled={savingNote}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                      >
                        {savingNote && (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        )}
                        {editingNote ? "Güncelle" : "Kaydet"}
                      </Button>
                    </div>
                  </form>
                )}

                {notes.length === 0 ? (
                  <div className="text-center py-10 rounded-xl bg-muted/20 border border-dashed">
                    <NotebookPen className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                    <p className="text-muted-foreground mt-3">
                      Henüz koçluk notu yok
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      İlk notunu ekleyerek takibe başla
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 rounded-xl bg-muted/30 border"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={cn(
                                categoryMap[note.category].color
                              )}
                            >
                              {categoryMap[note.category].label}
                            </Badge>
                            {note.rating != null && note.rating > 0 && (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                {note.rating}/5
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => startEdit(note)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-semibold mt-2">
                          {note.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-2">
                          {new Date(
                            note.created_at
                          ).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="p-8 text-center max-w-md mx-auto mt-20">
            <CardContent>
              <User className="w-10 h-10 text-muted-foreground/50 mx-auto" />
              <h2 className="text-lg font-semibold mt-4">
                Öğrenci bulunamadı
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Bu öğrenci kayıtlı değil veya size atanmamış.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
