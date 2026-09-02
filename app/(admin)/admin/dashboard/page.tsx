"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Chart } from "@/components/dashboard/chart";
import { Users, GraduationCap, BookOpen, Calendar, Plus, Trash2, Edit } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", full_name: "", role: "student", phone: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single();
      setUser({ ...authUser, ...profile });

      const { data: allUsers } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setUsers(allUsers || []);
      setLoading(false);
    }
    init();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser),
    });

    if (res.ok) {
      const data = await res.json();
      setUsers([{ ...newUser, id: data.id, created_at: new Date().toISOString() }, ...users]);
      setShowCreateDialog(false);
      setNewUser({ email: "", full_name: "", role: "student", phone: "" });
    }
    setCreateLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    const res = await fetch("/api/admin", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setUsers(users.filter(u => u.id !== id));
  };

  const stats = {
    totalStudents: users.filter(u => u.role === "student").length,
    totalCoaches: users.filter(u => u.role === "coach").length,
    totalAdmins: users.filter(u => u.role === "admin").length,
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <DashboardLayout role="admin" userName={user?.full_name || "Admin"}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Pusula platformu yönetim paneli</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500">
                <Plus className="h-4 w-4 mr-2" /> Yeni Kullanıcı
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle>Yeni Kullanıcı Oluştur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ad Soyad</Label>
                  <Input value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} required className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="bg-slate-800 border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={newUser.role} onValueChange={v => setNewUser({...newUser, role: v})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="student">Öğrenci</SelectItem>
                      <SelectItem value="coach">Koç</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">Varsayılan şifre: Pusula2025!</p>
                <Button type="submit" disabled={createLoading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
                  {createLoading ? "Oluşturuluyor..." : "Oluştur"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Toplam Öğrenci" value={stats.totalStudents} icon={<GraduationCap className="h-6 w-6" />} gradient="purple" trend="up" trendValue="+12 bu ay" />
          <StatCard title="Toplam Koç" value={stats.totalCoaches} icon={<Users className="h-6 w-6" />} gradient="green" />
          <StatCard title="Adminler" value={stats.totalAdmins} icon={<BookOpen className="h-6 w-6" />} gradient="blue" />
          <StatCard title="Toplam Kullanıcı" value={users.length} icon={<Calendar className="h-6 w-6" />} gradient="orange" />
        </div>

        {/* Users Table */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Kullanıcılar ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kullanıcı</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">E-posta</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Telefon</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Kayıt</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {u.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                          </div>
                          <span className="font-medium">{u.full_name || "İsimsiz"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={u.role === "admin" ? "default" : u.role === "coach" ? "success" : "info"}>
                          {u.role === "admin" ? "Admin" : u.role === "coach" ? "Koç" : "Öğrenci"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.phone || "-"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{formatDate(u.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteUser(u.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
