"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase";
import { cn, formatDate, getInitials } from "@/lib/utils";
import {
  Users,
  Search,
  Plus,
  Edit3,
  Trash2,
  Shield,
  GraduationCap,
  UserCheck,
  X,
  ChevronDown,
  Loader2,
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

const roleLabels: Record<string, string> = {
  admin: "Admin",
  coach: "Koç",
  student: "Öğrenci",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  coach: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  student: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const roleIcons: Record<string, React.ElementType> = {
  admin: Shield,
  coach: UserCheck,
  student: GraduationCap,
};

export default function AdminUsers() {
  const supabase = createClient();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
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
  const [error, setError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin");
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const counts = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    coach: users.filter((u) => u.role === "coach").length,
    student: users.filter((u) => u.role === "student").length,
  };

  const openAddModal = () => {
    setEditingUser(null);
    setError("");
    setFormData({ full_name: "", email: "", role: "student", phone: "" });
    setShowModal(true);
  };

  const openEditModal = (user: Profile) => {
    setEditingUser(user);
    setError("");
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
    setError("");

    const body = editingUser
      ? {
          id: editingUser.id,
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || null,
        }
      : {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || null,
        };

    const res = await fetch("/api/admin", {
      method: editingUser ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowModal(false);
      await fetchUsers();
    } else {
      const data = await res.json();
      setError(data.error || "Bir hata oluştu.");
    }

    setFormLoading(false);
  };

  const handleDelete = async (userId: string) => {
    setDeleting(true);
    const res = await fetch("/api/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    if (res.ok) {
      await fetchUsers();
    }
    setDeleting(false);
    setShowDeleteConfirm(null);
  };

  const stats = [
    {
      title: "Toplam Kullanıcı",
      value: counts.total,
      icon: Users,
      gradient: "from-purple-500/20 to-indigo-500/20 border-purple-500/30",
      iconColor: "text-purple-400",
    },
    {
      title: "Admin",
      value: counts.admin,
      icon: Shield,
      gradient: "from-purple-500/20 to-fuchsia-500/20 border-fuchsia-500/30",
      iconColor: "text-fuchsia-400",
    },
    {
      title: "Koç",
      value: counts.coach,
      icon: UserCheck,
      gradient: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
      iconColor: "text-emerald-400",
    },
    {
      title: "Öğrenci",
      value: counts.student,
      icon: GraduationCap,
      gradient: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
      iconColor: "text-blue-400",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                Kullanıcı Yönetimi
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Platformdaki tüm kullanıcıları yönetin
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/25"
            >
              <Plus className="w-4 h-4" />
              Yeni Kullanıcı
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className={cn(
                    "rounded-xl bg-gradient-to-br border p-4 md:p-5 transition-all hover:scale-[1.02]",
                    stat.gradient
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "p-2.5 rounded-xl bg-slate-800/50",
                        stat.iconColor
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Kullanıcılar
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="İsim veya e-posta ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 w-full sm:w-56"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 cursor-pointer w-full sm:w-auto"
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

            {loading ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-lg bg-slate-800/30 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
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
                          Telefon
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
                          <td
                            colSpan={6}
                            className="text-center py-12 text-slate-500"
                          >
                            Kullanıcı bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const RoleIcon = roleIcons[user.role];
                          return (
                            <tr
                              key={user.id}
                              className="hover:bg-slate-800/30 transition-colors"
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={cn(
                                      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0",
                                      user.role === "admin"
                                        ? "bg-gradient-to-br from-purple-500 to-fuchsia-500"
                                        : user.role === "coach"
                                        ? "bg-gradient-to-br from-emerald-500 to-green-500"
                                        : "bg-gradient-to-br from-blue-500 to-cyan-500"
                                    )}
                                  >
                                    {user.avatar_url ? (
                                      <img
                                        src={user.avatar_url}
                                        alt=""
                                        className="w-9 h-9 rounded-full object-cover"
                                      />
                                    ) : (
                                      getInitials(
                                        user.full_name || user.email
                                      )
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
                                <div className="flex items-center gap-2">
                                  <RoleIcon className="w-4 h-4 text-slate-500 lg:hidden" />
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                      roleBadgeColors[user.role]
                                    )}
                                  >
                                    <RoleIcon className="w-3.5 h-3.5 hidden lg:inline" />
                                    {roleLabels[user.role]}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 hidden lg:table-cell">
                                <span className="text-sm text-slate-400">
                                  {user.phone || "-"}
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
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setShowDeleteConfirm(user.id)
                                    }
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredUsers.length > 0 && (
                  <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
                    {filteredUsers.length} kullanıcı gösteriliyor
                  </div>
                )}
              </>
            )}
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
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  E-posta
                </label>
                <input
                  type="email"
                  required={!editingUser}
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="ornek@email.com"
                />
                {!editingUser && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Varsayılan şifre: Pusula2025!
                  </p>
                )}
              </div>
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
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
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
                    "flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium transition-all flex items-center justify-center gap-2",
                    formLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25"
                  )}
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : editingUser ? (
                    "Güncelle"
                  ) : (
                    "Ekle"
                  )}
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
              <h3 className="text-lg font-semibold text-white">
                Kullanıcıyı Sil
              </h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
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
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Sil"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
