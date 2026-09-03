"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PlanHistoryActions({ planId, studentId }: { planId: string; studentId: string }) {
  const router = useRouter();

  async function deletePlan() {
    if (!confirm("Bu planı silmek istediğinize emin misiniz? Tüm görevler de silinecektir.")) return;
    const supabase = createClient();
    await supabase.from("plans").delete().eq("id", planId);
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push(`/coach/student/${studentId}`)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={deletePlan}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
