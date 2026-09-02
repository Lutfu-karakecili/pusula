"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Meeting, Student, Profile } from "@/lib/types";
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
  Link2,
  FileText,
} from "lucide-react";

const statusConfig = {
  scheduled: {
    label: "Planlandı",
    variant: "info" as const,
  },
  completed: {
    label: "Tamamlandı",
    variant: "success" as const,
  },
  cancelled: {
    label: "İptal",
    variant: "destructive" as const,
  },
};

export default function MeetingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStudentId, setFormStudentId] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formDuration, setFormDuration] = useState("30");
  const [formZoomLink, setFormZoomLink] = useState("");
  const [formStatus, setFormStatus] = useState<
    "scheduled" | "completed" | "cancelled"
  >("scheduled");
  const [formNotes, setFormNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchStudents = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("students")
      .select("*, profiles!students_user_id_fkey(full_name, email)")
      .eq("coach_id", user.id);
    setStudents((data as Student[]) || []);
  }, []);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from("meetings")
      .select(
        "*, student:students!meetings_student_id_fkey(*, profiles!students_user_id_fkey(full_name, email))"
      )
      .eq("coach_id", user.id)
      .order("meeting_date", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;
    setMeetings((data as Meeting[]) || []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      await Promise.all([fetchStudents(), fetchMeetings()]);
    };
    init();
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
    setFormDate(
      new Date(meeting.meeting_date).toISOString().slice(0, 16)
    );
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = m.student?.profiles?.full_name?.toLowerCase() || "";
    const title = m.title.toLowerCase();
    return name.includes(q) || title.includes(q);
  });

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Koç"}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Görüşmeler
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Öğrencilerinizle planlanmış görüşmeler
            </p>
          </div>
          <Button
            onClick={openScheduleModal}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Görüşme
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Öğrenci veya başlık ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Tüm Durumlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="scheduled">Planlandı</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <Video className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Henüz görüşme bulunmuyor.
              </p>
              <Button
                variant="outline"
                onClick={openScheduleModal}
                className="mt-4"
              >
                İlk görüşmenizi planlayın
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => {
              const status = statusConfig[meeting.status];
              return (
                <Card
                  key={meeting.id}
                  className="hover:border-indigo-500/30 transition-all"
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold truncate">
                            {meeting.title}
                          </h3>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateTime(meeting.meeting_date)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {meeting.duration_min} dk
                          </span>
                          {meeting.student?.profiles && (
                            <span className="text-indigo-400">
                              {meeting.student.profiles.full_name}
                            </span>
                          )}
                        </div>
                        {meeting.description && (
                          <p className="text-muted-foreground text-sm mt-2 line-clamp-1">
                            {meeting.description}
                          </p>
                        )}
                        {meeting.notes && meeting.status === "completed" && (
                          <div className="mt-2 p-2 rounded bg-muted/40 text-xs text-muted-foreground line-clamp-2">
                            <FileText className="w-3 h-3 inline mr-1" />
                            {meeting.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {meeting.zoom_link && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              copyZoomLink(meeting.zoom_link!, meeting.id)
                            }
                          >
                            {copiedId === meeting.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Kopyalandı
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 mr-1" />
                                Zoom
                              </>
                            )}
                          </Button>
                        )}
                        {meeting.zoom_link && (
                          <a
                            href={meeting.zoom_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="icon">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(meeting)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={showScheduleModal || !!editingMeeting}
        onOpenChange={closeModals}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMeeting
                ? "Görüşmeyi Düzenle"
                : "Yeni Görüşme Planla"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={editingMeeting ? handleEdit : handleSchedule}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Öğrenci</Label>
              <Select
                value={formStudentId}
                onValueChange={setFormStudentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.profiles?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Görüşme başlığı"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Görüşme detayları"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tarih & Saat</Label>
                <Input
                  type="datetime-local"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Süre (dk)</Label>
                <Select
                  value={formDuration}
                  onValueChange={setFormDuration}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 dk</SelectItem>
                    <SelectItem value="30">30 dk</SelectItem>
                    <SelectItem value="45">45 dk</SelectItem>
                    <SelectItem value="60">60 dk</SelectItem>
                    <SelectItem value="90">90 dk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Zoom Linki</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="url"
                  value={formZoomLink}
                  onChange={(e) => setFormZoomLink(e.target.value)}
                  className="pl-9"
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>

            {editingMeeting && (
              <>
                <div className="space-y-2">
                  <Label>Durum</Label>
                  <Select
                    value={formStatus}
                    onValueChange={(v: string) =>
                      setFormStatus(
                        v as "scheduled" | "completed" | "cancelled"
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Planlandı</SelectItem>
                      <SelectItem value="completed">Tamamlandı</SelectItem>
                      <SelectItem value="cancelled">İptal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notlar</Label>
                  <Textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    placeholder="Görüşme notları..."
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeModals}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={
                  formLoading ||
                  !formStudentId ||
                  !formTitle ||
                  !formDate
                }
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
              >
                {formLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {editingMeeting ? "Güncelle" : "Planla"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
