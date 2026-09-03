"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock } from "lucide-react";

interface CoachProfile {
  id: string; full_name: string; phone: string | null;
  bio: string | null; university: string | null; department: string | null;
  own_exam_field: string | null; own_exam_rank: number | null;
  bank_name: string | null; iban: string | null;
  student_quota: number; lgs_enabled: boolean; pdr_enabled: boolean;
  profile_published: boolean; avatar_locked: boolean;
}

export function CoachProfileForm({ profile }: { profile: CoachProfile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [university, setUniversity] = useState(profile.university ?? "");
  const [department, setDepartment] = useState(profile.department ?? "");
  const [examField, setExamField] = useState(profile.own_exam_field ?? "");
  const [examRank, setExamRank] = useState(profile.own_exam_rank?.toString() ?? "");
  const [bankName, setBankName] = useState(profile.bank_name ?? "");
  const [iban, setIban] = useState(profile.iban ?? "");
  const [quota, setQuota] = useState(profile.student_quota?.toString() ?? "0");
  const [published, setPublished] = useState(profile.profile_published);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const supabase = createClient();
    await supabase.from("profiles").update({
      full_name: fullName, phone: phone || null, bio: bio || null,
      university: university || null, department: department || null,
      own_exam_field: examField || null, own_exam_rank: examRank ? Number(examRank) : null,
      bank_name: bankName || null, iban: iban || null,
      student_quota: Number(quota), profile_published: published,
    }).eq("id", profile.id);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Kişisel Bilgiler</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Ad Soyad</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Profil Fotoğrafı</Label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" /> Fotoğraf değişikliği için info@pusula.com adresine talep gönderiniz.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Akademik Geçmiş</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Üniversite</Label>
            <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="İstanbul Üniversitesi" />
          </div>
          <div className="space-y-2">
            <Label>Bölüm</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Matematik" />
          </div>
          <div className="space-y-2">
            <Label>Kendi Sınav Alanı</Label>
            <Input value={examField} onChange={(e) => setExamField(e.target.value)} placeholder="Sayısal" />
          </div>
          <div className="space-y-2">
            <Label>Kendi Sıralaması</Label>
            <Input type="number" value={examRank} onChange={(e) => setExamRank(e.target.value)} placeholder="12500" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Finansal Bilgiler</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Banka Adı</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ziraat Bankası" />
          </div>
          <div className="space-y-2">
            <Label>IBAN</Label>
            <Input value={iban} onChange={(e) => setIban(e.target.value)} placeholder="TR00 0000 0000 0000 0000 0000 00" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Koçluk Ayarları</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Biyografi</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Kendini kısaca tanıtır..." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Öğrenci Kontenjanı</Label>
              <Input type="number" value={quota} onChange={(e) => setQuota(e.target.value)} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Profil Yayın Durumu</Label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="rounded border-input" />
                {published ? "Yayında" : "Yayın Dışı"}
              </label>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" disabled className="rounded border-input" />
              LGS Koçluğu
              <span className="text-xs">(Yönetici onayı gereklidir)</span>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" disabled className="rounded border-input" />
              PDR / Rehberlik
            </label>
          </div>
        </div>
      </div>

      <Button variant="gradient" onClick={save} disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Kaydet
      </Button>
    </div>
  );
}
