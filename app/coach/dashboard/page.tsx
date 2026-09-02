"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/stat-card";
import {
  Users,
  CalendarCheck,
  BookOpen,
  Video,
  Eye,
  FileText,
  ClipboardList,
  Clock,
  Search,
  Loader2,
  Star,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  grade: string | null;
  target_score: number | null;
  last_active: string | null;
}

interface CoachingNote {
  id: string;
  student_name: string;
  content: string;
  created_at: string;
  category: string;
}

interface Stats {
  totalStudents: number;
  activePlans: number;
  pendingHomework: number;
  weeklyMeetings: number;
}

export default function CoachDashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [notes, setNotes] = useState<CoachingNote[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activePlans: 0,
    pendingHomework: 0,
    weeklyMeetings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(profileData);

      const coachId = user.id;

      const [studentsRes, plansRes, homeworkRes, meetingsRes, notesRes] =
        await Promise.all([
          supabase
            .from("students")
            .select("*")
            .eq("coach_id", coachId)
            .order("full_name"),
          supabase
            .from("plans")
            .select("id", { count: "exact", head: true })
            .eq("coach_id", coachId)
            .eq("status", "active"),
          supabase
            .from("homework")
            .select("id", { count: "exact", head: true })
            .eq("coach_id", coachId)
            .eq("status", "pending"),
          supabase
            .from("meetings")
            .select("id", { count: "exact", head: true })
            .eq("coach_id", coachId)
            .gte(
              "scheduled_at",
              new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toISOString()
            )
            .lte("scheduled_at", new Date().toISOString()),
          supabase
            .from("coaching_notes")
            .select("*")
            .eq("coach_id", coachId)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

      setStudents(studentsRes.data || []);
      setStats({
        totalStudents: studentsRes.data?.length || 0,
        activePlans: plansRes.count || 0,
        pendingHomework: homeworkRes.count || 0,
        weeklyMeetings: meetingsRes.count || 0,
      });

      if (notesRes.data && notesRes.data.length > 0) {
        const studentIds = [
          ...new Set(notesRes.data.map((n: any) => n.student_id)),
        ];
        const { data: studentProfiles } = await supabase
          .from("students")
          .select("user_id, full_name")
          .in("user_id", studentIds);

        const nameMap = new Map(
          (studentProfiles || []).map((s: any) => [s.user_id, s.full_name])
        );

        setNotes(
          notesRes.data.map((n: any) => ({
            id: n.id,
            student_name: nameMap.get(n.student_id) || "Öğrenci",
            content: n.content,
            created_at: n.created_at,
            category: n.category || "Genel",
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm text-slate-500">Yükleniyor...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Hoş Geldin,{" "}
                <span className="gradient-text">
                  {profile?.full_name?.split(" ")[0] || "Koç"}
                </span>
              </h1>
              <p className="text-slate-500 mt-1">
                Bugünkü durumuna genel bir bakış
              </p>
            </div>
            <div className="text-sm text-slate-500 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
              {new Date().toLocaleDateString("tr-TR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Öğrencilerim"
              value={stats.totalStudents}
              description="Aktif koçluk öğrencileri"
              icon={Users}
              gradient="purple"
              trend="up"
              trendValue="+2 bu ay"
            />
            <StatCard
              title="Aktif Planlar"
              value={stats.activePlans}
              description="Devam eden çalışma planları"
              icon={CalendarCheck}
              gradient="green"
            />
            <StatCard
              title="Bekleyen Ödev"
              value={stats.pendingHomework}
              description="Kontrol edilmeyi bekliyor"
              icon={BookOpen}
              gradient="orange"
            />
            <StatCard
              title="Bu Haftaki Görüşme"
              value={stats.weeklyMeetings}
              description="Son 7 gün"
              icon={Video}
              gradient="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="gradient-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-purple-400" />
                    Öğrencilerim
                  </h2>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ara..."
                      className="pl-9 pr-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-full sm:w-64"
                    />
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {searchQuery
                        ? "Sonuç bulunamadı"
                        : "Henüz öğrenciniz yok"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {student.avatar_url ? (
                              <img
                                src={student.avatar_url}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              student.full_name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {student.full_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {student.grade && `${student.grade} `}
                              {student.target_score &&
                                `• Hedef: ${student.target_score} puan`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            title="Profili Görüntüle"
                            className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="Plan Oluştur"
                            className="p-2 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>
                          <button
                            title="Ödev Ata"
                            className="p-2 rounded-lg text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredStudents.length > 0 && (
                  <button className="w-full mt-4 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-2">
                    Tüm Öğrencileri Gör
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="gradient-card-blue p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Son Koçluk Notları
                </h2>

                {notes.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">Henüz not eklenmemiş</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {note.student_name}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              {note.category}
                            </span>
                          </div>
                          <span className="text-xs text-slate-600">
                            {new Date(note.created_at).toLocaleDateString(
                              "tr-TR",
                              {
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="gradient-card-green p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-emerald-400" />
                  Hızlı İşlemler
                </h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 text-left hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Yeni Plan Oluştur
                      </p>
                      <p className="text-xs text-slate-500">
                        Çalışma planı hazırla
                      </p>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 text-left hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Ödev Oluştur
                      </p>
                      <p className="text-xs text-slate-500">
                        Ödev ata ve takip et
                      </p>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 text-left hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Görüşme Planla
                      </p>
                      <p className="text-xs text-slate-500">
                        Video görüşme ayarla
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="gradient-card p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <CalendarCheck className="w-5 h-5 text-purple-400" />
                  Haftalık İlerleme Grafiği
                </h2>
                <div className="flex items-center justify-center h-48 rounded-lg bg-slate-800/30 border border-slate-700/30 border-dashed">
                  <div className="text-center">
                    <BarChart3Placeholder className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      Haftalık İlerleme Grafiği
                    </p>
                    <p className="text-xs text-slate-700 mt-1">Yakında eklenecek</p>
                  </div>
                </div>
              </div>

              <div className="gradient-card p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Yaklaşan Görüşmeler
                </h2>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 text-center">
                    <Video className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      Yakında planlanmış görüşme yok
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function BarChart3Placeholder({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}
