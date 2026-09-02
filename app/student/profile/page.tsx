"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";
import { cn, getInitials } from "@/lib/utils";
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Lock,
  BookOpen,
  Target,
  TrendingUp,
  GraduationCap,
  Users,
  CheckCircle2,
  Calendar,
  FileText,
  Loader2,
  Pencil,
  X,
  Shield,
  Award,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
}

interface StudentData {
  user_id: string;
  coach_id: string;
  target_score: number | null;
  current_score: number | null;
  grade: string | null;
  coach_name?: string;
}

interface Stats {
  homework_completed: number;
  meetings_total: number;
  coaching_notes: number;
}

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [stats, setStats] = useState<Stats>({
    homework_completed: 0,
    meetings_total: 0,
    coaching_notes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const fetchProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setProfileForm({
        full_name: profileData.full_name || "",
        phone: profileData.phone || "",
        avatar_url: profileData.avatar_url || "",
      });
    }

    const { data: studentInfo } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (studentInfo) {
      let coachName = null;
      if (studentInfo.coach_id) {
        const { data: coachData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", studentInfo.coach_id)
          .single();
        coachName = coachData?.full_name;
      }
      setStudentData({ ...studentInfo, coach_name: coachName });
    }

    const [homeworkResult, meetingsResult, notesResult] = await Promise.all([
      supabase
        .from("homework")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user.id)
        .eq("status", "completed"),
      supabase
        .from("meetings")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user.id),
      supabase
        .from("coaching_notes")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user.id),
    ]);

    setStats({
      homework_completed: homeworkResult.count || 0,
      meetings_total: meetingsResult.count || 0,
      coaching_notes: notesResult.count || 0,
    });
  }, []);

  useEffect(() => {
    fetchProfile().then(() => setLoading(false));
  }, [fetchProfile]);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingProfile(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileForm.full_name,
        phone: profileForm.phone,
        avatar_url: profileForm.avatar_url,
      })
      .eq("id", user.id);

    if (error) {
      setMessage({ type: "error", text: "Profil güncellenemedi" });
    } else {
      setMessage({ type: "success", text: "Profil başarıyla güncellendi" });
      setEditingProfile(false);
      fetchProfile();
    }
    setSavingProfile(false);
  };

  const handlePasswordChange = async () => {
    setSavingPassword(true);
    setMessage(null);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: "error", text: "Yeni şifreler eşleşmiyor" });
      setSavingPassword(false);
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setMessage({
        type: "error",
        text: "Yeni şifre en az 6 karakter olmalı",
      });
      setSavingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordForm.new_password,
    });

    if (error) {
      setMessage({ type: "error", text: "Şifre güncellenemedi" });
    } else {
      setMessage({ type: "success", text: "Şifre başarıyla güncellendi" });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    }
    setSavingPassword(false);
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${user.id}.${fileExt}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (!error) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setProfileForm({ ...profileForm, avatar_url: publicUrl });
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      fetchProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <User className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Profilim
              </h1>
              <p className="text-slate-400 mt-1">
                Hesap bilgilerinizi yönetin
              </p>
            </div>
          </div>

          {message && (
            <div
              className={cn(
                "p-4 rounded-lg border text-sm font-medium",
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              )}
            >
              {message.text}
            </div>
          )}

          <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(profile?.full_name || profile?.email || "U")
                  )}
                </div>
                <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-bold text-white">
                  {profile?.full_name || "İsimsiz Kullanıcı"}
                </h2>
                <p className="text-slate-400 flex items-center gap-2 justify-center sm:justify-start mt-1">
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </p>
                {profile?.phone && (
                  <p className="text-slate-400 flex items-center gap-2 justify-center sm:justify-start mt-1">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </p>
                )}
              </div>

              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {editingProfile ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
                {editingProfile ? "İptal" : "Düzenle"}
              </button>
            </div>

            {editingProfile && (
              <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Ad Soyad
                    </label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          full_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Adınız Soyadınız"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Profil Fotoğrafı URL
                  </label>
                  <input
                    type="url"
                    value={profileForm.avatar_url}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        avatar_url: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleProfileSave}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Kaydet
                  </button>
                </div>
              </div>
            )}
          </div>

          {studentData && (
            <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-purple-400" />
                Akademik Bilgiler
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-medium text-slate-400">
                      Hedef Puan
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {studentData.target_score ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-slate-400">
                      Güncel Puan
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {studentData.current_score ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-medium text-slate-400">
                      Sınıf
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {studentData.grade ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-400">
                      Koçum
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white truncate">
                    {studentData.coach_name ?? "Atanmamış"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-purple-400" />
              Şifre Değiştir
            </h3>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Yeni Şifre
                </label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      new_password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="En az 6 karakter"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Yeni Şifre (Tekrar)
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirm_password: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="Şifrenizi tekrar girin"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                disabled={
                  savingPassword ||
                  !passwordForm.new_password ||
                  !passwordForm.confirm_password
                }
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all disabled:opacity-50"
              >
                {savingPassword ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Şifreyi Güncelle
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-purple-400" />
              Hesap İstatistikleri
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">
                  {stats.homework_completed}
                </p>
                <p className="text-sm text-slate-400 mt-1">Tamamlanan Ödev</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-4 text-center">
                <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">
                  {stats.meetings_total}
                </p>
                <p className="text-sm text-slate-400 mt-1">Toplam Görüşme</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-4 text-center">
                <FileText className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">
                  {stats.coaching_notes}
                </p>
                <p className="text-sm text-slate-400 mt-1">Koçluk Notu</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
