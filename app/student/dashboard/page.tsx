"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/stat-card";
import { cn, formatDate } from "@/lib/utils";
import {
  Target,
  TrendingUp,
  BookOpen,
  Video,
  Calendar,
  MessageSquare,
  FileText,
  ChevronRight,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

interface StudentData {
  id: string;
  user_id: string;
  full_name: string;
  grade: string | null;
  target_score: number | null;
  current_score: number | null;
  coach_id: string | null;
}

interface Plan {
  id: string;
  title: string;
  subjects: string[] | null;
  start_date: string;
  end_date: string;
  status: string;
}

interface Homework {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  status: string;
  description: string | null;
}

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  active: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "Bekliyor",
  completed: "Tamamlandı",
  cancelled: "İptal",
  scheduled: "Planlandı",
  active: "Aktif",
};

export default function StudentDashboardPage() {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
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

      const [plansRes, homeworkRes, meetingsRes] = await Promise.all([
        supabase
          .from("plans")
          .select("*")
          .eq("student_id", user.id)
          .eq("status", "active")
          .order("start_date", { ascending: false })
          .limit(3),
        supabase
          .from("homework")
          .select("*")
          .eq("student_id", user.id)
          .eq("status", "pending")
          .order("due_date", { ascending: true })
          .limit(5),
        supabase
          .from("meetings")
          .select("*")
          .eq("student_id", user.id)
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(3),
      ]);

      setPlans(plansRes.data || []);
      setHomework(homeworkRes.data || []);
      setMeetings(meetingsRes.data || []);

      setLoading(false);
    };

    fetchData();
  }, []);

  const getScoreDifference = () => {
    if (!student?.current_score || !student?.target_score) return null;
    const diff = student.target_score - student.current_score;
    if (diff > 0) return `${diff} net kaldi`;
    if (diff < 0) return `${Math.abs(diff)} net asti`;
    return "Hedefe ulasti!";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Gunaydin";
    if (hour < 18) return "Iyi gunler";
    return "Iyi aksamlar";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm text-slate-500">Yukleniyor...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {getGreeting()},{" "}
                <span className="gradient-text">
                  {profile?.full_name?.split(" ")[0] || "Ogrenci"}
                </span>
              </h1>
              <p className="text-slate-500 mt-1">
                {student?.grade && `${student.grade} • `}
                {getScoreDifference() || "Bugunun durumuna genel bakis"}
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
              title="Hedef Net"
              value={student?.target_score ?? "-"}
              description="YKS hedef puaniniz"
              icon={Target}
              gradient="purple"
            />
            <StatCard
              title="Guncel Net"
              value={student?.current_score ?? "-"}
              description="Mevcut puan durumu"
              icon={TrendingUp}
              gradient="green"
              trend={
                student?.current_score && student?.target_score
                  ? student.current_score >= student.target_score
                    ? "up"
                    : "down"
                  : undefined
              }
              trendValue={getScoreDifference() || undefined}
            />
            <StatCard
              title="Aktif Odev"
              value={homework.length}
              description="Bekleyen odev sayisi"
              icon={BookOpen}
              gradient="orange"
            />
            <StatCard
              title="Yaklasan Gorusme"
              value={meetings.length}
              description="Planlanan gorusmeler"
              icon={Video}
              gradient="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="gradient-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    Haftalik Plan Ozeti
                  </h2>
                </div>
                {plans.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">Aktif plan bulunmuyor</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Kocunuz bir plan olusturacak
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/30"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-medium text-white">
                              {plan.title}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDate(plan.start_date)} -{" "}
                              {formatDate(plan.end_date)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full border",
                              statusColors[plan.status] || statusColors.active
                            )}
                          >
                            {statusLabels[plan.status] || plan.status}
                          </span>
                        </div>
                        {plan.subjects && plan.subjects.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {plan.subjects.map((subject, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              >
                                {subject}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="gradient-card-orange p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-orange-400" />
                    Yaklasan Odevler
                  </h2>
                  <button
                    onClick={() => router.push("/student/homework")}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Tumunu Gor
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {homework.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">Bekleyen odev yok</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Tum odevlerinizi tamamladiniz
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {homework.map((hw) => (
                      <div
                        key={hw.id}
                        className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all"
                      >
                        <div className="p-2 rounded-lg bg-orange-500/10 shrink-0">
                          <FileText className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {hw.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {hw.subject}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400">
                            {new Date(hw.due_date).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full border inline-block mt-1",
                              statusColors[hw.status] || statusColors.pending
                            )}
                          >
                            {statusLabels[hw.status] || hw.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="gradient-card-green p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                  <Video className="w-5 h-5 text-emerald-400" />
                  Yaklasan Gorusmeler
                </h2>
                {meetings.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">Planlanmis gorusme yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-sm font-medium text-white">
                            {meeting.title}
                          </h3>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full border",
                              statusColors[meeting.status] ||
                                statusColors.scheduled
                            )}
                          >
                            {statusLabels[meeting.status] || meeting.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {new Date(meeting.scheduled_at).toLocaleDateString(
                            "tr-TR",
                            {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="gradient-card p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Ilerleme Ozeti
                </h2>
                <div className="flex items-center justify-center h-48 rounded-lg bg-slate-800/30 border border-slate-700/30 border-dashed">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      Net Gelisme Grafigi
                    </p>
                    <p className="text-xs text-slate-700 mt-1">Yakinda</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-indigo-950/80 via-purple-900/60 to-indigo-950/80 border border-indigo-500/20 p-5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  Hizli Islemler
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/student/planning")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 text-left hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Planlarimi Gor
                      </p>
                      <p className="text-xs text-slate-500">
                        Haftalik calisma plani
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => router.push("/student/ai")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 text-left hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        AI Asistan
                      </p>
                      <p className="text-xs text-slate-500">
                        Sorularini yanitla
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => router.push("/student/homework")}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 text-left hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Odevlerim
                      </p>
                      <p className="text-xs text-slate-500">
                        Odevleri goruntule
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
