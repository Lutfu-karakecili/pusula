"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  TrendingUp,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Activity,
  UserPlus,
  BookOpen,
  Video,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "coach" | "student";
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: "user_added" | "plan_created" | "meeting_completed" | "note_added";
  message: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  coach: "Koç",
  student: "Öğrenci",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  coach: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  student: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function AdminDashboard() {
  const supabase = createClient();

  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCoaches: 0,
    weekMeetings: 0,
    avgScore: 0,
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "student" as "admin" | "coach" | "student",
    phone: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchActivities(),
    ]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count: studentCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    const { count: coachCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "coach");

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const { count: meetingCount } = await supabase
      .from("meetings")
      .select("*", { count: "exact", head: true })
      .gte("meeting_date", weekStart.toISOString());

    const { data: scoreData } = await supabase
      .from("students")
      .select("current_score");

    const avgScore = scoreData && scoreData.length > 0
      ? Math.round(scoreData.reduce((sum, s) => sum + (s.current_score || 0), 0) / scoreData.length)
      : 0;

    setStats({
      totalStudents: studentCount || 0,
      activeCoaches: coachCount || 0,
      weekMeetings: meetingCount || 0,
      avgScore,
    });
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setUsers(data);
  };

  const fetchActivities = async () => {
    const recentProfiles = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentMeetings = await supabase
      .from("meetings")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentPlans = await supabase
      .from("plans")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const items: ActivityItem[] = [];

    if (recentProfiles.data) {
      recentProfiles.data.forEach((p) => {
        items.push({
          id: `profile-${p.id}`,
          type: "user_added",
          message: `${p.full_name || "Yeni kullanıcı"} eklendi (${roleLabels[p.role]})`,
          time: p.created_at,
          icon: UserPlus,
          color: "text-emerald-400",
        });
      });
    }

    if (recentMeetings.data) {
      recentMeetings.data.forEach((m) => {
        items.push({
          id: `meeting-${m.id}`,
          type: "meeting_completed",
          message: `Görüşme: ${m.title}`,
          time: m.created_at,
          icon: Video,
          color: "text-blue-400",
        });
      });
    }

    if (recentPlans.data) {
      recentPlans.data.forEach((p) => {
        items.push({
          id: `plan-${p.id}`,
          type: "plan_created",
          message: `Plan oluşturuldu: ${p.title}`,
          time: p.created_at,
          icon: BookOpen,
          color: "text-purple-400",
        });
      });
    }

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivities(items.slice(0, 8));
  };

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ full_name: "", email: "", role: "student", phone: "" });
    setShowModal(true);
  };

  const openEditModal = (user: Profile) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    if (editingUser) {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || null,
        })
        .eq("id", editingUser.id);

      if (!error) {
        setShowModal(false);
        await fetchUsers();
        await fetchStats();
      }
    } else {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: "Pusula2025!",
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
          },
        },
      });

      if (!authError && authData.user) {
        await supabase.from("profiles").upsert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || null,
        });

        setShowModal(false);
        await fetchUsers();
        await fetchStats();
      }
    }

    setFormLoading(false);
  };

  const handleDelete = async (userId: string) => {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (!error) {
      await fetchUsers();
      await fetchStats();
    }
    setShowDeleteConfirm(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Admin Dashboard
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                PUSULA platform genel durumu
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25"
            >
              <UserPlus className="w-4 h-4" />
              Yeni Kullanıcı
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Toplam Öğrenci"
                value={stats.totalStudents}
                description="Kayıtlı öğrenci sayısı"
                icon={GraduationCap}
                gradient="purple"
                trend="up"
                trendValue="+12 bu ay"
              />
              <StatCard
                title="Aktif Koç"
                value={stats.activeCoaches}
                description="Aktif koç sayısı"
                icon={Users}
                gradient="blue"
                trend="up"
                trendValue="+3 yeni"
              />
              <StatCard
                title="Bu Haftaki Görüşme"
                value={stats.weekMeetings}
                description="Planlanan görüşmeler"
                icon={CalendarCheck}
                gradient="green"
                trend="neutral"
                trendValue="Bu hafta"
              />
              <StatCard
                title="Ortalama Net"
                value={stats.avgScore}
                description="Öğrenci ortalaması"
                icon={TrendingUp}
                gradient="orange"
                trend="up"
                trendValue="+8.5 ort"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      Kullanıcı Yönetimi
                    </h2>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Ara..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full sm:w-48"
                        />
                      </div>
                      <div className="relative">
                        <select
                          value={roleFilter}
                          onChange={(e) => setRoleFilter(e.target.value)}
                          className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                        >
                          <option value="all">Tüm Roller</option>
                          <option value="admin">Admin</option>
                          <option value="coach">Koç</option>
                          <option value="student">Öğrenci</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">
                          Kullanıcı
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                          E-posta
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">
                          Rol
                        </th>
                        <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">
                          Kayıt Tarihi
                        </th>
                        <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-5 py-3">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-500">
                            Kullanıcı bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                                  {user.avatar_url ? (
                                    <img
                                      src={user.avatar_url}
                                      alt=""
                                      className="w-9 h-9 rounded-full object-cover"
                                    />
                                  ) : (
                                    getInitials(user.full_name || user.email)
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {user.full_name || "İsimsiz"}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate md:hidden">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 hidden md:table-cell">
                              <span className="text-sm text-slate-300">
                                {user.email}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={cn(
                                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                  roleBadgeColors[user.role]
                                )}
                              >
                                {roleLabels[user.role]}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 hidden lg:table-cell">
                              <span className="text-sm text-slate-400">
                                {formatDate(user.created_at)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                  title="Düzenle"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(user.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Sil"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
                    {filteredUsers.length} kullanıcı gösteriliyor
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="p-4 md:p-5 border-b border-slate-800">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Son Aktiviteler
                  </h2>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {activities.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      Henüz aktivite bulunmuyor.
                    </div>
                  ) : (
                    activities.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          className="px-4 md:px-5 py-3.5 hover:bg-slate-800/20 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg bg-slate-800/50 shrink-0", item.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-200 leading-snug">
                                {item.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDate(item.time)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-indigo-950/80 border border-indigo-500/20 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <Shield className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Platform Özeti</h3>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Toplam Kullanıcı</span>
                    <span className="text-white font-medium">{users.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Admin Sayısı</span>
                    <span className="text-white font-medium">
                      {users.filter((u) => u.role === "admin").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Koç / Öğrenci Oranı</span>
                    <span className="text-white font-medium">
                      {stats.activeCoaches} / {stats.totalStudents}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-white">
                {editingUser ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="Ad Soyad"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    E-posta
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    placeholder="ornek@email.com"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Varsayılan şifre: Pusula2025!
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Rol
                </label>
                <div className="relative">
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as "admin" | "coach" | "student",
                      })
                    }
                    className="w-full appearance-none px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer"
                  >
                    <option value="student">Öğrenci</option>
                    <option value="coach">Koç</option>
                    <option value="admin">Admin</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="0555 555 55 55"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={cn(
                    "flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium transition-all",
                    formLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25"
                  )}
                >
                  {formLoading
                    ? "Kaydediliyor..."
                    : editingUser
                    ? "Güncelle"
                    : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Kullanıcıyı Sil</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
