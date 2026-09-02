"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useSidebar } from "@/components/sidebar";
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
  BarChart3,
  MessageSquareQuote,
} from "lucide-react";
import { getInitials } from "@/lib/utils";

interface StudentProfile {
  full_name: string;
  email: string;
}

interface Student {
  user_id: string;
  coach_id: string;
  target_score: number | null;
  current_score: number | null;
  grade: string | null;
}

interface Note {
  id: string;
  student_id: string;
  coach_id: string;
  category: "academic" | "behavioral" | "motivational" | "general";
  title: string;
  content: string;
  rating: number | null;
  created_at: string;
}

const categoryMap: Record<Note["category"], { label: string; color: string }> = {
  academic: { label: "Akademik", color: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
  behavioral: { label: "Davranış", color: "bg-amber-500/20 text-amber-400 border-amber-500/20" },
  motivational: { label: "Motivasyon", color: "bg-pink-500/20 text-pink-400 border-pink-500/20" },
  general: { label: "Genel", color: "bg-slate-500/20 text-slate-400 border-slate-500/20" },
};

export default function CoachStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { Sidebar } = useSidebar();
  const studentId = params?.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Note["category"]>("general");
  const [rating, setRating] = useState(0);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    loadStudent();
  }, [studentId]);

  const loadStudent = async () => {
    setLoading(true);
    const { data: studentData } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", studentId)
      .single();

    if (studentData) {
      setStudent(studentData);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", studentData.user_id)
        .single();
      setProfile(profileData || null);
    }

    const { data: notesData } = await supabase
      .from("coaching_notes")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    setNotes(notesData || []);
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

  const startEdit = (note: Note) => {
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
      await supabase.from("coaching_notes").update(payload).eq("id", editingNote.id);
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
      ? Math.min(100, Math.round((student.current_score / student.target_score) * 100))
      : 0;

  return (
    <div className="min-h-screen flex bg-[hsl(var(--background))]">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <button
          onClick={() => router.push("/coach/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
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
            <div className="gradient-card p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shrink-0 glow">
                  {profile?.full_name ? getInitials(profile.full_name) : <User className="w-8 h-8" />}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold text-white">
                    {profile?.full_name || "Öğrenci"}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">{profile?.email}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-sm text-slate-300 bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1">
                      <GraduationCap className="w-4 h-4 text-purple-400" />
                      {student.grade || "Sınıf bilgisi yok"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 mt-4 sm:mt-0">
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text">
                      {student.current_score ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Mevcut Puan</p>
                  </div>
                  <div className="w-px bg-slate-700" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {student.target_score ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Hedef Puan</p>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    <Target className="w-4 h-4 text-purple-400" />
                    Hedefe İlerleme
                  </span>
                  <span className="text-white font-semibold">%{scoreProgress}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                    style={{ width: `${scoreProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => router.push(`/coach/planning?student=${studentId}`)}
                className="gradient-card p-4 flex items-center gap-3 hover:border-purple-500/40 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Plan Oluştur</p>
                  <p className="text-xs text-slate-400 mt-0.5">Haftalık plan hazırla</p>
                </div>
              </button>
              <button
                onClick={() => router.push(`/coach/homework?student=${studentId}`)}
                className="gradient-card p-4 flex items-center gap-3 hover:border-blue-500/40 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Ödev Ekle</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ödev ataması yap</p>
                </div>
              </button>
              <button
                onClick={() => router.push(`/coach/meetings?student=${studentId}`)}
                className="gradient-card p-4 flex items-center gap-3 hover:border-emerald-500/40 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <MessageSquareQuote className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Görüşme Planla</p>
                  <p className="text-xs text-slate-400 mt-0.5">Toplantı ayarla</p>
                </div>
              </button>
            </div>

            <div className="gradient-card-blue p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h2 className="font-semibold text-white">Performans Grafiği</h2>
                </div>
                <span className="text-xs text-slate-400">Son 8 hafta</span>
              </div>
              <div className="h-64 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 text-blue-400/50 mx-auto" />
                  <p className="text-sm text-slate-400 mt-2">Grafik buraya eklenecek</p>
                  <p className="text-xs text-slate-500 mt-1">Puan gelişim takibi</p>
                </div>
              </div>
            </div>

            <div className="gradient-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <NotebookPen className="w-5 h-5 text-purple-400" />
                  <h2 className="font-semibold text-white">Koçluk Notları</h2>
                </div>
                <button
                  onClick={startCreate}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg px-3 py-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Not Ekle
                </button>
              </div>

              {showForm && (
                <form
                  onSubmit={handleSaveNote}
                  className="mb-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700 space-y-4"
                >
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(categoryMap) as Note["category"][]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`text-sm font-medium rounded-lg px-3 py-1.5 border transition-colors ${
                          category === cat
                            ? categoryMap[cat].color
                            : "text-slate-400 bg-slate-800/50 border-slate-700 hover:text-white"
                        }`}
                      >
                        {categoryMap[cat].label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300">Başlık</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Not başlığı"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300">İçerik</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={3}
                      className="mt-1 w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                      placeholder="Not detayları"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300">Değerlendirme</label>
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-0.5 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-600"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-slate-400">
                        {rating > 0 ? `${rating}/5` : "Puan ver"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-sm font-medium text-slate-400 hover:text-white rounded-lg px-4 py-2 transition-colors"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={savingNote}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg px-4 py-2 transition-all disabled:opacity-50"
                    >
                      {savingNote && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingNote ? "Güncelle" : "Kaydet"}
                    </button>
                  </div>
                </form>
              )}

              {notes.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-slate-800/40 border border-dashed border-slate-700">
                  <NotebookPen className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-slate-400 mt-3">Henüz koçluk notu yok</p>
                  <p className="text-sm text-slate-500 mt-1">
                    İlk notunu ekleyerek takibe başla
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-xl bg-slate-800/40 border border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-medium rounded-full border px-2.5 py-0.5 ${categoryMap[note.category].color}`}
                          >
                            {categoryMap[note.category].label}
                          </span>
                          {note.rating != null && note.rating > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              {note.rating}/5
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(note)}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            aria-label="Düzenle"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                            aria-label="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-white mt-2">{note.title}</h3>
                      <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="gradient-card p-8 text-center max-w-md mx-auto mt-20">
            <User className="w-10 h-10 text-slate-500 mx-auto" />
            <h2 className="text-lg font-semibold text-white mt-4">Öğrenci bulunamadı</h2>
            <p className="text-sm text-slate-400 mt-1">
              Bu öğrenci kayıtlı değil veya size atanmamış.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
