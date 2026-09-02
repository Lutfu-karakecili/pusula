"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";
import { formatDateTime } from "@/lib/utils";
import {
  Video,
  Plus,
  Search,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Check,
  X,
  Edit3,
  Loader2,
  Filter,
  ChevronDown,
  Link2,
  FileText,
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
  student?: {
    full_name: string;
    email: string;
  };
}

interface Student {
  id: string;
  full_name: string;
  email: string;
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

export default function MeetingsPage() {
  const supabase = createClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [filterStudent, setFilterStudent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStudentId, setFormStudentId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formDuration, setFormDuration] = useState("30");
  const [formZoomLink, setFormZoomLink] = useState("");
  const [formStatus, setFormStatus] = useState<"scheduled" | "completed" | "cancelled">("scheduled");
  const [formNotes, setFormNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "student");
    setStudents(data || []);
  }, [supabase]);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("meetings")
      .select("*, student:profiles!meetings_student_id_fkey(full_name, email)")
      .eq("coach_id", user.id)
      .order("meeting_date", { ascending: false });

    if (filterStudent !== "all") {
      query = query.eq("student_id", filterStudent);
    }
    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }
    if (filterDateFrom) {
      query = query.gte("meeting_date", filterDateFrom);
    }
    if (filterDateTo) {
      const endDate = new Date(filterDateTo);
      endDate.setHours(23, 59, 59);
      query = query.lte("meeting_date", endDate.toISOString());
    }

    const { data } = await query;
    setMeetings(data || []);
    setLoading(false);
  }, [supabase, filterStudent, filterStatus, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchStudents();
    fetchMeetings();
  }, [fetchStudents, fetchMeetings]);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormStudentId("");
    setFormDate("");
    setFormDuration("30");
    setFormZoomLink("");
    setFormStatus("scheduled");
    setFormNotes("");
  };

  const openScheduleModal = () => {
    resetForm();
    setShowScheduleModal(true);
  };

  const openEditModal = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormTitle(meeting.title);
    setFormDescription(meeting.description || "");
    setFormStudentId(meeting.student_id);
    setFormDate(new Date(meeting.meeting_date).toISOString().slice(0, 16));
    setFormDuration(String(meeting.duration_min));
    setFormZoomLink(meeting.zoom_link || "");
    setFormStatus(meeting.status);
    setFormNotes(meeting.notes || "");
  };

  const closeModals = () => {
    setShowScheduleModal(false);
    setEditingMeeting(null);
    resetForm();
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("meetings").insert({
      coach_id: user.id,
      student_id: formStudentId,
      title: formTitle,
      description: formDescription,
      meeting_date: new Date(formDate).toISOString(),
      duration_min: Number(formDuration),
      zoom_link: formZoomLink,
      status: "scheduled",
    });

    setFormLoading(false);
    closeModals();
    fetchMeetings();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    setFormLoading(true);

    await supabase
      .from("meetings")
      .update({
        title: formTitle,
        description: formDescription,
        student_id: formStudentId,
        meeting_date: new Date(formDate).toISOString(),
        duration_min: Number(formDuration),
        zoom_link: formZoomLink,
        status: formStatus,
        notes: formNotes,
      })
      .eq("id", editingMeeting.id);

    setFormLoading(false);
    closeModals();
    fetchMeetings();
  };

  const copyZoomLink = async (link: string, id: string) => {
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMeetings = meetings.filter((m) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = m.student?.full_name?.toLowerCase() || "";
      const title = m.title.toLowerCase();
      if (!name.includes(q) && !title.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold gradient-text">Görüşmeler</h1>
              <p className="text-slate-400 text-sm mt-1">Öğrencilerinizle planlanmış görüşmeler</p>
            </div>
            <button
              onClick={openScheduleModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Yeni Görüşme
            </button>
          </div>

          <div className="gradient-card p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Öğrenci veya başlık ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <select
                    value={filterStudent}
                    onChange={(e) => setFilterStudent(e.target.value)}
                    className="appearance-none px-4 py-2.5 pr-8 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option value="all">Tüm Öğrenciler</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none px-4 py-2.5 pr-8 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="scheduled">Planlandı</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">İptal</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  placeholder="Başlangıç"
                  className="px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all [color-scheme:dark]"
                />
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  placeholder="Bitiş"
                  className="px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="gradient-card p-12 text-center">
              <Video className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Henüz görüşme bulunmuyor.</p>
              <button
                onClick={openScheduleModal}
                className="mt-4 px-4 py-2 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/20 text-sm hover:bg-purple-600/30 transition-colors"
              >
                İlk görüşmenizi planlayın
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMeetings.map((meeting) => {
                const status = statusConfig[meeting.status];
                return (
                  <div key={meeting.id} className="gradient-card p-4 md:p-5 hover:border-purple-500/30 transition-all">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold truncate">{meeting.title}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}>
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
                          {meeting.student && (
                            <span className="text-purple-400">{meeting.student.full_name}</span>
                          )}
                        </div>
                        {meeting.description && (
                          <p className="text-slate-500 text-sm mt-2 line-clamp-1">{meeting.description}</p>
                        )}
                        {meeting.notes && meeting.status === "completed" && (
                          <div className="mt-2 p-2 rounded bg-slate-800/50 text-xs text-slate-400 line-clamp-2">
                            <FileText className="w-3 h-3 inline mr-1" />
                            {meeting.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {meeting.zoom_link && (
                          <button
                            onClick={() => copyZoomLink(meeting.zoom_link, meeting.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors"
                          >
                            {copiedId === meeting.id ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Kopyalandı
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Zoom
                              </>
                            )}
                          </button>
                        )}
                        <a
                          href={meeting.zoom_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => openEditModal(meeting)}
                          className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-purple-400 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {(showScheduleModal || editingMeeting) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModals} />
          <div className="relative w-full max-w-lg gradient-card p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingMeeting ? "Görüşmeyi Düzenle" : "Yeni Görüşme Planla"}
              </h2>
              <button
                onClick={closeModals}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingMeeting ? handleEdit : handleSchedule} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Öğrenci</label>
                <div className="relative">
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 pr-10 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    required
                  >
                    <option value="">Öğrenci seçin</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Başlık</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  placeholder="Görüşme başlığı"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Açıklama</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                  rows={2}
                  placeholder="Görüşme detayları"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Tarih & Saat</label>
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all [color-scheme:dark]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Süre (dk)</label>
                  <div className="relative">
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="w-full appearance-none px-4 py-2.5 pr-10 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    >
                      <option value="15">15 dk</option>
                      <option value="30">30 dk</option>
                      <option value="45">45 dk</option>
                      <option value="60">60 dk</option>
                      <option value="90">90 dk</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Zoom Linki</label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="url"
                    value={formZoomLink}
                    onChange={(e) => setFormZoomLink(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              </div>

              {editingMeeting && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Durum</label>
                    <div className="relative">
                      <select
                        value={formStatus}
                        onChange={(e) => setFormStatus(e.target.value as typeof formStatus)}
                        className="w-full appearance-none px-4 py-2.5 pr-10 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="scheduled">Planlandı</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="cancelled">İptal</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Notlar</label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"
                      rows={3}
                      placeholder="Görüşme notları..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !formStudentId || !formTitle || !formDate}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingMeeting ? (
                    "Güncelle"
                  ) : (
                    "Planla"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
