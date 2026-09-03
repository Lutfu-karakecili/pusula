"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export function ReviewForm({ coachId, existingReview }: {
  coachId: string;
  existingReview?: { id: string; rating: number; comment?: string } | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (rating === 0) return;
    setLoading(true);
    const supabase = createClient();

    if (existingReview) {
      await supabase.from("coach_reviews").update({ rating, comment: comment || null }).eq("id", existingReview.id);
    } else {
      await supabase.from("coach_reviews").insert({ coach_id: coachId, rating, comment: comment || null });
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Puanın</p>
        <StarRating value={rating} onChange={setRating} />
      </div>
      <div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Koçun hakkında yorum yaz (opsiyonel)..."
          rows={3}
        />
      </div>
      <Button variant="gradient" onClick={submit} disabled={loading || rating === 0}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {existingReview ? "Güncelle" : "Değerlendir"}
      </Button>
    </div>
  );
}
