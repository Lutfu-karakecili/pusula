"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Eye, CheckCircle, XCircle } from "lucide-react";

export function CoachApplicationActions({ applicationId, currentStatus }: {
  applicationId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  async function updateStatus(status: string) {
    const supabase = createClient();
    await supabase.from("coach_applications").update({ status }).eq("id", applicationId);
    router.refresh();
  }

  if (currentStatus === "accepted" || currentStatus === "rejected") return null;

  return (
    <div className="flex gap-1">
      {currentStatus === "pending" && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateStatus("reviewed")} title="İncelendi">
          <Eye className="h-4 w-4" />
        </Button>
      )}
      <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => updateStatus("accepted")} title="Kabul Et">
        <CheckCircle className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateStatus("rejected")} title="Reddet">
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );
}
