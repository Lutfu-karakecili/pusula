"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export function ChooseCoachButton({ coachId, currentCoachId, studentId }: {
  coachId: string; currentCoachId: string | null; studentId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (currentCoachId === coachId) {
    return <Badge variant="success">Mevcut Koçun</Badge>;
  }

  async function choose() {
    if (!confirm("Bu koçu seçmek istediğinize emin misiniz?")) return;
    setLoading(true);
    const res = await fetch("/api/student/choose-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coach_id: coachId }),
    });
    const data = await res.json();
    if (res.ok) {
      router.refresh();
    } else {
      alert(data.error || "Bir hata oluştu.");
    }
    setLoading(false);
  }

  return (
    <Button variant="gradient" size="sm" className="w-full" onClick={choose} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Koç Seç"}
    </Button>
  );
}
