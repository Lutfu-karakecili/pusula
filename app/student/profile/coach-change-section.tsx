"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";
import { ArrowRightLeft } from "lucide-react";

export function CoachChangeSection({ coachId, coachName }: {
  coachId?: string | null;
  coachName?: string | null;
}) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mevcut Koçum</CardTitle>
      </CardHeader>
      <CardContent>
        {coachId && coachName ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{initials(coachName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{coachName}</p>
                <p className="text-xs text-muted-foreground">Koçun</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/student/coaches")}>
              <ArrowRightLeft className="h-4 w-4 mr-1" /> Koç Değiştir
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Henüz bir koçunuz yok.</p>
            <Button variant="gradient" size="sm" onClick={() => router.push("/student/coaches")}>
              Koç Seç
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
