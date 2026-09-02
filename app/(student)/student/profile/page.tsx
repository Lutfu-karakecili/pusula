"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/utils";
import type { Profile, Student, Homework, Meeting } from "@/lib/types";
import {
  User,
  Phone,
  Mail,
  Lock,
  Target,
  TrendingUp,
  BookOpen,
  Calendar,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [stats, setStats] = useState({ completedHomework: 0, totalMeetings: 0 });
  const supabase = createClient();

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
  });
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState({ type: "" as "" | "success" | "error", text: "" });
  const [pwMessage, setPwMessage] = useState({ type: "" as "" | "success" | "error", text: "" });

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
      setForm({
        full_name: profileData?.full_name || "",
        phone: profileData?.phone || "",
      });

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setStudent(studentData);

      if (studentData) {
        const { data: hw } = await supabase
          .from("homework")
          .select("id, status")
          .eq("student_id", studentData.id);
        const { count: mtCount } = await supabase
          .from("meetings")
          .select("id", { count: "exact", head: true })
          .eq("student_id", studentData.id);

        setStats({
          completedHomework: hw?.filter((h) => h.status === "completed").length || 0,
          totalMeetings: mtCount || 0,
        });
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone })
      .eq("id", profile?.id);

    if (error) {
      setMessage({ type: "error", text: "Güncelleme başarısız oldu" });
    } else {
      setProfile((prev) =>
        prev ? { ...prev, full_name: form.full_name, phone: form.phone } : prev
      );
      setMessage({ type: "success", text: "Profil güncellendi" });
    }
    setSaving(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage({ type: "", text: "" });

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwMessage({ type: "error", text: "Şifreler eşleşmiyor" });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPwMessage({ type: "error", text: "Şifre en az 6 karakter olmalı" });
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: passwords.newPassword,
    });

    if (error) {
      setPwMessage({ type: "error", text: "Şifre güncellenemedi" });
    } else {
      setPwMessage({ type: "success", text: "Şifre güncellendi" });
      setPasswords({ newPassword: "", confirmPassword: "" });
    }
    setPasswordSaving(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <DashboardLayout role="student" userName={profile?.full_name || "Öğrenci"}>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Profilim</h1>
          <p className="text-muted-foreground">
            Kişisel bilgilerini ve ayarlarını yönet
          </p>
        </div>

        {/* Profile Card */}
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {profile?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "??"}
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {profile?.full_name || "İsimsiz"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {profile?.email}
                </p>
                <Badge variant="info" className="mt-1">
                  Öğrenci
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{profile?.phone || "Telefon eklenmemiş"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Kayıt: {profile ? formatDate(profile.created_at) : "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Info */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Akademik Bilgiler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-indigo-400" />
                  <p className="text-sm text-muted-foreground">Hedef Puan</p>
                </div>
                <p className="text-2xl font-bold">
                  {student?.target_score || 0}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-600/20 to-green-600/20 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <p className="text-sm text-muted-foreground">Mevcut Puan</p>
                </div>
                <p className="text-2xl font-bold">
                  {student?.current_score || 0}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-600/20 to-amber-600/20 border border-orange-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-orange-400" />
                  <p className="text-sm text-muted-foreground">Sınıf</p>
                </div>
                <p className="text-2xl font-bold">
                  {student?.grade || "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
              <p className="text-2xl font-bold">{stats.completedHomework}</p>
              <p className="text-xs text-muted-foreground">Tamamlanan Ödev</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold">{stats.totalMeetings}</p>
              <p className="text-xs text-muted-foreground">Toplantı</p>
            </CardContent>
          </Card>
        </div>

        {/* Edit Profile */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Profili Düzenle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Ad Soyad</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="0555 555 55 55"
                />
              </div>
              {message.text && (
                <p
                  className={`text-sm ${
                    message.type === "success"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {message.text}
                </p>
              )}
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Şifre Değiştir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni Şifre</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  placeholder="En az 6 karakter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Şifreyi tekrar gir"
                  required
                />
              </div>
              {pwMessage.text && (
                <p
                  className={`text-sm ${
                    pwMessage.type === "success"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {pwMessage.text}
                </p>
              )}
              <Button
                type="submit"
                disabled={passwordSaving}
                variant="outline"
              >
                <Lock className="h-4 w-4 mr-2" />
                {passwordSaving ? "Güncelleniyor..." : "Şifreyi Güncelle"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
