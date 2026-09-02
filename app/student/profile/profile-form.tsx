"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save } from "lucide-react";
import type { Profile, Student } from "@/lib/database.types";

export function ProfileForm({ student }: { student: Student & { profile: Profile } }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(student.profile.full_name);
  const [phone, setPhone] = useState(student.profile.phone ?? "");
  const [school, setSchool] = useState(student.school_name ?? "");
  const [grade, setGrade] = useState(student.grade ?? "");
  const [targetField, setTargetField] = useState(student.target_field ?? "");
  const [targetScore, setTargetScore] = useState(student.target_score?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    const supabase = createClient();

    await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", student.id);
    await supabase
      .from("students")
      .update({
        school_name: school,
        grade,
        target_field: targetField || null,
        target_score: targetScore ? Number(targetScore) : null,
      })
      .eq("id", student.id);

    setLoading(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Ad Soyad</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Telefon</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" />
        </div>
        <div className="space-y-2">
          <Label>Okul</Label>
          <Input value={school} onChange={(e) => setSchool(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Sınıf</Label>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Seçiniz</option>
            <option value="11">11. Sınıf</option>
            <option value="12">12. Sınıf</option>
            <option value="mezun">Mezun</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Hedef Alan</Label>
          <select value={targetField} onChange={(e) => setTargetField(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            <option value="">Seçiniz</option>
            <option value="sayisal">Sayısal</option>
            <option value="esit_agirlik">Eşit Ağırlık</option>
            <option value="sozel">Sözel</option>
            <option value="dil">Dil</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Hedef Net</Label>
          <Input type="number" step="0.5" value={targetScore} onChange={(e) => setTargetScore(e.target.value)} />
        </div>
      </div>
      <Button type="submit" variant="gradient" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saved ? "Kaydedildi ✓" : "Kaydet"}
      </Button>
    </form>
  );
}
