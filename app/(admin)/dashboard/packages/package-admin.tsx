"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface Package {
  id: string; name: string; duration_months: number; price: number;
  discounted_price: number | null; features: string[]; is_popular: boolean; active: boolean;
}

export function PackageAdmin() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [form, setForm] = useState({ name: "", duration_months: 1, price: "", discounted_price: "", features: "", is_popular: false });
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("packages").select("*").order("price");
    setPackages((data ?? []) as Package[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", duration_months: 1, price: "", discounted_price: "", features: "", is_popular: false });
    setDialogOpen(true);
  }

  function openEdit(pkg: Package) {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      duration_months: pkg.duration_months ?? 1,
      price: pkg.price.toString(),
      discounted_price: pkg.discounted_price?.toString() ?? "",
      features: (pkg.features ?? []).join("\n"),
      is_popular: pkg.is_popular,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name || !form.price) return;
    setSaving(true);
    const supabase = createClient();
    const features = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
    const payload = {
      name: form.name,
      duration_months: form.duration_months,
      price: Number(form.price),
      discounted_price: form.discounted_price ? Number(form.discounted_price) : null,
      features,
      is_popular: form.is_popular,
    };

    if (editing) {
      await supabase.from("packages").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("packages").insert(payload);
    }

    setSaving(false);
    setDialogOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Bu paketi silmek istediğinize emin misiniz?")) return;
    const supabase = createClient();
    await supabase.from("packages").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Paketler</h1>
        <Button variant="gradient" onClick={openCreate}><Plus className="h-4 w-4" /> Yeni Paket</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : packages.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Henüz paket yok.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <Card key={pkg.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{pkg.name}</p>
                    {pkg.is_popular && <Badge>Popüler</Badge>}
                    {!pkg.active && <Badge variant="destructive">Pasif</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pkg.duration_months} ay · {pkg.price}₺
                    {pkg.discounted_price && ` → ${pkg.discounted_price}₺`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(pkg.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Paketi Düzenle" : "Yeni Paket"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Paket Adı</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Süre (Ay)</Label>
                <Input type="number" value={form.duration_months} onChange={(e) => setForm({ ...form, duration_months: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Fiyat (₺)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>İndirimli Fiyat (₺, opsiyonel)</Label>
              <Input type="number" value={form.discounted_price} onChange={(e) => setForm({ ...form, discounted_price: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Özellikler (satır satır)</Label>
              <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={4} placeholder="Her özelliği yeni satıra yazın..." />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_popular} onChange={(e) => setForm({ ...form, is_popular: e.target.checked })} className="rounded border-input" />
              Popüler olarak işaretle
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Vazgeç</Button>
            <Button variant="gradient" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
