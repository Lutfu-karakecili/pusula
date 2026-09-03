"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle, Upload } from "lucide-react";

export default function KocBasvurusuPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");
  const [department, setDepartment] = useState("");
  const [examRank, setExamRank] = useState("");
  const [motivationNote, setMotivationNote] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !phone) return;
    setLoading(true);

    let cvUrl: string | null = null;

    // CV yükle (varsa)
    if (cvFile) {
      const supabase = createClient();
      const fileName = `${Date.now()}_${cvFile.name}`;
      const { data: uploadData } = await supabase.storage
        .from("coach-application-cvs")
        .upload(fileName, cvFile);

      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from("coach-application-cvs")
          .getPublicUrl(uploadData.path);
        cvUrl = urlData.publicUrl;
      }
    }

    const supabase = createClient();
    await supabase.from("coach_applications").insert({
      full_name: fullName,
      email,
      phone,
      university: university || null,
      department: department || null,
      exam_rank: examRank ? Number(examRank) : null,
      motivation_note: motivationNote || null,
      cv_url: cvUrl,
    });

    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="text-xl font-bold">Başvurunuz Alındı!</h2>
            <p className="text-sm text-muted-foreground">
              Başvurunuz incelendikten sonra sizinle iletişime geçilecektir.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-8">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Koç Başvurusu</CardTitle>
          <CardDescription>
            Ekibimize katılmak için başvuru formunu doldurun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Ad Soyad *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>E-posta *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Telefon *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Üniversite</Label>
                <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="İstanbul Üniversitesi" />
              </div>
              <div className="space-y-2">
                <Label>Bölüm</Label>
                <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Matematik" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>YKS Sıralaması</Label>
              <Input type="number" value={examRank} onChange={(e) => setExamRank(e.target.value)} placeholder="Örn: 5000" />
            </div>
            <div className="space-y-2">
              <Label>Motivasyon Notu</Label>
              <Textarea value={motivationNote} onChange={(e) => setMotivationNote(e.target.value)} placeholder="Neden koç olmak istiyorsunuz?" rows={4} />
            </div>
            <div className="space-y-2">
              <Label>CV (PDF)</Label>
              <div
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input p-3 text-sm text-muted-foreground hover:bg-muted/50"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {cvFile ? cvFile.name : "CV dosyası seçin (opsiyonel)"}
              </div>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Başvuruyu Gönder"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
