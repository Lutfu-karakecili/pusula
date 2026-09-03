"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/utils";
import { ChooseCoachButton } from "./choose-coach-button";
import { Search, Users } from "lucide-react";
import Link from "next/link";

const FIELD_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "sayisal", label: "Sayısal" },
  { value: "esit_agirlik", label: "Eşit Ağırlık" },
  { value: "sozel", label: "Sözel" },
  { value: "dil", label: "Dil" },
];

const FIELD_LABELS: Record<string, string> = {
  sayisal: "Sayısal",
  esit_agirlik: "Eşit Ağırlık",
  sozel: "Sözel",
  dil: "Dil",
};

interface Coach {
  id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  university?: string;
  department?: string;
  own_exam_field?: string;
  own_exam_rank?: number;
  student_quota: number;
  profile_published: boolean;
  gender?: string;
  _count?: { assigned: number };
  _rating?: { avg_rating: number; review_count: number } | null;
}

export function CoachesFilteredList({ coaches, studentId, currentCoachId }: {
  coaches: Coach[];
  studentId: string;
  currentCoachId?: string | null;
}) {
  const [search, setSearch] = useState("");
  const [field, setField] = useState("");
  const [availability, setAvailability] = useState(false);

  const filtered = useMemo(() => {
    let list = coaches;

    if (field) {
      list = list.filter((c) => c.own_exam_field === field);
    }

    if (availability) {
      list = list.filter((c) => c.student_quota > 0 && (!c._count || c._count.assigned < c.student_quota));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.university?.toLowerCase().includes(q) ||
        c.department?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [coaches, field, availability, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Üniversite, bölüm veya koç adı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {FIELD_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm whitespace-nowrap">
          <input
            type="checkbox"
            checked={availability}
            onChange={(e) => setAvailability(e.target.checked)}
            className="rounded border-input"
          />
          Müsait olanlar
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Filtrelere uygun koç bulunamadı.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((coach) => (
            <Card key={coach.id} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{initials(coach.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/student/coaches/${coach.id}`} className="font-medium hover:underline">{coach.full_name}</Link>
                    {coach.university && <p className="text-xs text-muted-foreground">{coach.university}</p>}
                    {coach.department && <p className="text-xs text-muted-foreground">{coach.department}</p>}
                  </div>
                </div>
                {coach.bio && <p className="mb-3 text-sm text-muted-foreground line-clamp-3">{coach.bio}</p>}
                <div className="flex flex-wrap gap-2 mb-3">
                  {coach.own_exam_field && <Badge variant="secondary">{FIELD_LABELS[coach.own_exam_field] ?? coach.own_exam_field}</Badge>}
                  {coach.own_exam_rank && <Badge variant="outline">Sıralama: {coach.own_exam_rank.toLocaleString()}</Badge>}
                  {coach._rating ? (
                    <Badge variant="outline">
                      {coach._rating.avg_rating}/5 ({coach._rating.review_count})
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="opacity-50">Henüz değerlendirme yok</Badge>
                  )}
                  {coach.student_quota > 0 && (
                    <Badge variant={coach._count && coach._count.assigned >= coach.student_quota ? "destructive" : "outline"}>
                      Kontenjan: {coach._count?.assigned ?? 0}/{coach.student_quota}
                    </Badge>
                  )}
                </div>
                <ChooseCoachButton coachId={coach.id} currentCoachId={currentCoachId ?? null} studentId={studentId} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
