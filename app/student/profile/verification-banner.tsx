"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, Upload, Loader2 } from "lucide-react";

export function VerificationBanner({ status, studentId }: { status: string; studentId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Dosya 5MB'dan büyük olamaz."); return; }

    setUploading(true);
    const supabase = createClient();
    const path = `${studentId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("student-documents").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("student-documents").getPublicUrl(path);
      await supabase.from("students").update({
        verification_document_url: data.publicUrl,
        verification_status: "pending",
      }).eq("id", studentId);
      router.refresh();
    }
    setUploading(false);
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800 dark:text-orange-200">Eksik Belge</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Öğrenci Belgesi — Profilinizin tamamlanması için lütfen öğrenci belgenizi yükleyiniz.</span>
        {status === "missing" || status === "rejected" ? (
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" disabled={uploading} asChild>
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Belge Yükle
              </span>
            </Button>
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} />
          </label>
        ) : status === "pending" ? (
          <span className="text-sm font-medium text-orange-600">Onay Bekleniyor</span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
