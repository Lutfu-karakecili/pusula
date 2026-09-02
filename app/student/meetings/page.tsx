"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";
import { formatDateTime } from "@/lib/utils";
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  ChevronDown,
  FileText,
  User,
} from "lucide-react";

interface Meeting {
  id: string;
  student_id: string;
  coach_id: string;
  title: string;
  description: string;
  meeting_date: string;
  duration_min: number;
  zoom_link: string;
  status: "scheduled" | "completed" | "cancelled";
  notes: string;
  created_at: string;
  coach?: {
    full_name: string;
    email: string;
  };
}

const statusConfig = {
  scheduled: {
    label: "Planlandı",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  completed: {
    label: "Tamamlandı",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  cancelled: {
    label: "İptal",
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
  },
};

export default function StudentMeetingsPage() {
  const supabase = createClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: studentData } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!studentData) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from("meetings")
      .select("*, coach:profiles!meetings_coach_id_fkey(full_name, email)")
      .eq("student_id", studentData.id)
      .order("meeting_date", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;
    setMeetings(data || []);
    setLoading(false);
  }, [supabase, filterStatus]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const toggleNotes = (id: string) => {
    setExpandedNotes(expandedNotes === id ? null : id);
  };

  const upcomingMeetings = meetings.filter(
    (m) => m.status === "scheduled" && new Date(m.meeting_date) > new Date()
  );
  const pastMeetings = meetings.filter(
    (m) => m.status === "completed" || new Date(m.meeting_date) <= new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">
              Görüşmelerim
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Koçunuzla planlanmış ve tamamlanmış görüşmeler
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "Tümü" },
              { value: "scheduled", label: "Planlandı" },
              { value: "completed", label: "Tamamlandı" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === f.value
                    ? "bg-purple-600/20 text-purple-400 border border-purple-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-white hover:border-slate-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="gradient-card p-12 text-center">
              <Video className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
                {filterStatus !== "all"
                  ? "Bu durumda görüşme bulunmuyor."
                  : "Henüz görüşmeniz bulunmuyor."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filterStatus === "all" && (
                <>
                  {upcomingMeetings.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        Yaklaşan Görüşmeler
                      </h2>
                      {upcomingMeetings.map((meeting) => {
                        const status = statusConfig[meeting.status];
                        return (
                          <MeetingCard
                            key={meeting.id}
                            meeting={meeting}
                            status={status}
                            expandedNotes={expandedNotes}
                            toggleNotes={toggleNotes}
                          />
                        );
                      })}
                    </div>
                  )}

                  {pastMeetings.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                        Geçmiş Görüşmeler
                      </h2>
                      {pastMeetings.map((meeting) => {
                        const status = statusConfig[meeting.status];
                        return (
                          <MeetingCard
                            key={meeting.id}
                            meeting={meeting}
                            status={status}
                            expandedNotes={expandedNotes}
                            toggleNotes={toggleNotes}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {filterStatus !== "all" && (
                <div className="space-y-3">
                  {meetings.map((meeting) => {
                    const status = statusConfig[meeting.status];
                    return (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        status={status}
                        expandedNotes={expandedNotes}
                        toggleNotes={toggleNotes}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MeetingCard({
  meeting,
  status,
  expandedNotes,
  toggleNotes,
}: {
  meeting: Meeting;
  status: { label: string; bg: string; text: string; border: string };
  expandedNotes: string | null;
  toggleNotes: (id: string) => void;
}) {
  return (
    <div className="gradient-card p-4 md:p-5 hover:border-purple-500/30 transition-all">
      <div className="flex flex-col gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-white font-semibold">{meeting.title}</h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
            >
              {status.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateTime(meeting.meeting_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {meeting.duration_min} dk
            </span>
            {meeting.coach && (
              <span className="flex items-center gap-1.5 text-purple-400">
                <User className="w-3.5 h-3.5" />
                {meeting.coach.full_name}
              </span>
            )}
          </div>

          {meeting.description && (
            <p className="text-slate-500 text-sm mt-2 line-clamp-1">
              {meeting.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {meeting.zoom_link && meeting.status === "scheduled" && (
            <a
              href={meeting.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium transition-all"
            >
              <Video className="w-4 h-4" />
              Toplantıya Katıl
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          )}

          {meeting.notes && meeting.status === "completed" && (
            <button
              onClick={() => toggleNotes(meeting.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {expandedNotes === meeting.id
                ? "Notları Gizle"
                : "Notları Gör"}
            </button>
          )}
        </div>

        {meeting.notes &&
          meeting.status === "completed" &&
          expandedNotes === meeting.id && (
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">
                  Görüşme Notları
                </span>
              </div>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {meeting.notes}
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
