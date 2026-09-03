"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Phone, CheckCircle, XCircle } from "lucide-react";

export function ConsultationActions({ bookingId, currentStatus }: {
  bookingId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  async function updateStatus(status: string) {
    const supabase = createClient();
    await supabase.from("consultation_bookings").update({ status }).eq("id", bookingId);
    router.refresh();
  }

  if (currentStatus === "completed" || currentStatus === "cancelled") return null;

  return (
    <div className="flex gap-1">
      {currentStatus === "pending" && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateStatus("contacted")} title="İletişime Geçildi">
          <Phone className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => updateStatus("completed")} title="Tamamlandı">
        <CheckCircle className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateStatus("cancelled")} title="İptal">
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
