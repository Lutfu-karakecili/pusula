"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Profile, Student, Meeting } from "@/lib/types";
import {
  Video,
  Calendar,
  Clock,
  FileText,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function StudentMeetingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setStudent(studentData);

      if (studentData) {
        const { data: mt } = await supabase
          .from("meetings")
          .select("*")
          .eq("student_id", studentData.id)
          .order("meeting_date", { ascending: false });
        setMeetings(mt || []);
      }
      setLoading(false);
    }
    init();
  }, []);

  const upcoming = meetings.filter(
    (m) => m.status === "scheduled" && new Date(m.meeting_date) >= new Date()
  );
  const past = meetings.filter(
    (m) =>
      m.status === "completed" ||
      (m.status === "scheduled" && new Date(m.meeting_date) < new Date())
  );

  const statusConfig = {
    scheduled: {
      label: "Planlandı",
      variant: "info" as const,
      icon: Calendar,
    },
    completed: {
      label: "Tamamlandı",
      variant: "success" as const,
      icon: CheckCircle2,
    },
    cancelled: {
      label: "İptal",
      variant: "destructive" as const,
      icon: XCircle,
    },
  };

  const MeetingCard = ({
    meeting,
    isUpcoming,
  }: {
    meeting: Meeting;
    isUpcoming: boolean;
  }) => {
    const cfg = statusConfig[meeting.status];
    const Icon = cfg.icon;

    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isUpcoming
                    ? "bg-indigo-500/20 text-indigo-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{meeting.title}</p>
                {meeting.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {meeting.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(meeting.meeting_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {meeting.duration_min} dk
                  </span>
                </div>
              </div>
            </div>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>

          {/* Meeting Notes */}
          {meeting.notes && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">
                  Toplantı Notları
                </p>
              </div>
              <p className="text-sm whitespace-pre-wrap">{meeting.notes}</p>
            </div>
          )}

          {/* Zoom Link */}
          {isUpcoming && meeting.zoom_link && (
            <div className="mt-4">
              <a
                href={meeting.zoom_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500">
                  <Video className="h-4 w-4 mr-2" />
                  Zoom'a Katıl
                  <ExternalLink className="h-3.5 w-3.5 ml-2" />
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <DashboardLayout role="student" userName={profile?.full_name || "Öğrenci"}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Toplantılarım</h1>
          <p className="text-muted-foreground">
            Koçunla planlanan toplantıları takip et
          </p>
        </div>

        {/* Upcoming Meetings */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" />
            Yaklaşan Toplantılar ({upcoming.length})
          </h2>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((mt) => (
                <MeetingCard key={mt.id} meeting={mt} isUpcoming />
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-8 text-center">
                <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Yaklaşan toplantı bulunmuyor
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Past Meetings */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Geçmiş Toplantılar ({past.length})
          </h2>
          {past.length > 0 ? (
            <div className="space-y-3">
              {past.map((mt) => (
                <MeetingCard key={mt.id} meeting={mt} isUpcoming={false} />
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-8 text-center">
                <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Henüz toplantı yapılmamış
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
