"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { initials, ROLE_LABELS } from "@/lib/utils";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";

interface UserRow {
  id: string; full_name: string; email: string; role: string; phone: string | null;
}

export function UsersTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    const { data } = await res.json();
    setUsers(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm("Bu kullanıcıyı kalıcı olarak silmek istediğine emin misin?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" size="sm"><Plus className="h-4 w-4" /> Yeni Kullanıcı</Button>
          </DialogTrigger>
          <DialogContent>
            <CreateUserForm onCreated={() => { setCreateOpen(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9"><AvatarFallback>{initials(u.full_name)}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={u.role === "admin" ? "default" : u.role === "coach" ? "secondary" : "outline"}>
                  {ROLE_LABELS[u.role]}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => setEditUser(u)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          {editUser && <EditUserForm user={editUser} onSaved={() => { setEditUser(null); load(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ full_name: fullName, email, password, role }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Oluşturulamadı.");
      setLoading(false);
      return;
    }
    onCreated();
  }

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Yeni Kullanıcı</DialogTitle></DialogHeader>
      <div className="space-y-2"><Label>Ad Soyad</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
      <div className="space-y-2"><Label>E-posta</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="space-y-2"><Label>Geçici Şifre</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <div className="space-y-2">
        <Label>Rol</Label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
          <option value="student">Öğrenci</option>
          <option value="coach">Koç</option>
          <option value="admin">Yönetici</option>
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button variant="gradient" onClick={submit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Oluştur
        </Button>
      </DialogFooter>
    </div>
  );
}

function EditUserForm({ user, onSaved }: { user: UserRow; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user.full_name);
  const [role, setRole] = useState(user.role);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ full_name: fullName, role, phone }),
    });
    setLoading(false);
    onSaved();
  }

  return (
    <div className="space-y-4">
      <DialogHeader><DialogTitle>Kullanıcıyı Düzenle</DialogTitle></DialogHeader>
      <div className="space-y-2"><Label>Ad Soyad</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
      <div className="space-y-2"><Label>Telefon</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div className="space-y-2">
        <Label>Rol</Label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
          <option value="student">Öğrenci</option>
          <option value="coach">Koç</option>
          <option value="admin">Yönetici</option>
        </select>
      </div>
      <DialogFooter>
        <Button variant="gradient" onClick={submit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Kaydet
        </Button>
      </DialogFooter>
    </div>
  );
}
