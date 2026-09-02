"use client";

import { createClient } from "@/lib/supabase";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
} from "lucide-react";

interface Subject {
  name: string;
  hours: number;
  topics: string[];
}

interface Plan {
  id: string;
  student_id: string;
  week_start: string;
  title: string;
  description: string | null;
  subjects: Subject[];
  status: "active" | "completed";
  created_at: string;
}

const TR_DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const SUBJECT_COLORS: Record<string, string> = {
  Matematik: "from-blue-500 to-indigo-600",
  "Türkçe": "from-purple-500 to-pink-600",
  Fizik: "from-cyan-500 to-blue-600",
  Kimya: "from-emerald-500 to-teal-600",
  Biyoloji: "from-green-500 to-emerald-600",
  Tarih: "from-orange-500 to-amber-600",
  "Coğrafya": "from-yellow-500 to-orange-600",
  "Felsefe": "from-violet-500 to-purple-600",
  "İngilizce": "from-pink-500 to-rose-600",
};

const DEFAULT_COLOR = "from-gray-500 to-slate-600";

function getSubjectColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(SUBJECT_COLORS)) {
    if (key.toLowerCase() === lower) return value;
  }
  return DEFAULT_COLOR;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateTR(date: Date): string {
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return `${formatDateTR(monday)} - ${formatDateTR(sunday)}`;
}

function getTotalHours(subjects: Subject[]): number {
  return subjects.reduce((sum, s) => sum + s.hours, 0);
}

function distributeSubjectsToDays(
  subjects: Subject[]
): Map<number, Subject[]> {
  const totalHours = getTotalHours(subjects);
  const hoursPerDay = Math.ceil(totalHours / 7);
  const days = new Map<number, Subject[]>();
  for (let i = 0; i < 7; i++) days.set(i, []);

  let currentDay = 0;
  for (const subject of subjects) {
    let hoursLeft = subject.hours;
    while (hoursLeft > 0) {
      const assign = Math.min(hoursLeft, Math.max(1, hoursPerDay));
      days.get(currentDay)!.push({
        ...subject,
        hours: assign,
      });
      hoursLeft -= assign;
      currentDay = (currentDay + 1) % 7;
    }
  }

  return days;
}

export default function StudentPlanningPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (plans.length === 0) return;
    const targetMonday = getMonday(new Date());
    targetMonday.setDate(targetMonday.getDate() + weekOffset * 7);
    const targetStr = targetMonday.toISOString().split("T")[0];

    const match = plans.find((p) => p.week_start === targetStr);
    if (match) {
      setSelectedPlan(match);
    } else {
      const closest = plans.reduce((prev, curr) => {
        const prevDiff = Math.abs(
          new Date(prev.week_start).getTime() - targetMonday.getTime()
        );
        const currDiff = Math.abs(
          new Date(curr.week_start).getTime() - targetMonday.getTime()
        );
        return currDiff < prevDiff ? curr : prev;
      });
      setSelectedPlan(closest);
    }
  }, [weekOffset, plans]);

  const fetchPlans = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!student) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("student_id", student.id)
      .order("week_start", { ascending: false });

    setPlans((data as Plan[]) || []);
    setLoading(false);
  };

  const currentMonday = getMonday(new Date());
  currentMonday.setDate(currentMonday.getDate() + weekOffset * 7);
  const currentMondayStr = currentMonday.toISOString().split("T")[0];

  const dayDistribution = selectedPlan
    ? distributeSubjectsToDays(selectedPlan.subjects)
    : new Map<number, Subject[]>();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Haftalık Planlarım
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Ders programınızı takip edin ve ilerlemenizi görüntüleyin
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-slate-300 px-3 py-2 rounded-lg bg-slate-800/50 min-w-[200px] text-center">
                {formatWeekRange(currentMonday)}
              </span>
              <button
                onClick={() => setWeekOffset((o) => o + 1)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Henüz plan bulunmuyor
              </h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Koçunuz tarafından size bir haftalık plan atanmadı. Plan
                oluşturulduğunda burada görüntülenecektir.
              </p>
            </div>
          ) : !selectedPlan ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Calendar className="w-12 h-12 text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-1">
                Bu hafta için plan yok
              </h3>
              <p className="text-slate-400 text-sm">
                Seçilen haftada atanmış bir plan bulunmuyor.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="gradient-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/20">
                      <Target className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Toplam Ders</p>
                      <p className="text-2xl font-bold text-white">
                        {selectedPlan.subjects.length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="gradient-card p-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20">
                      <Clock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Toplam Saat</p>
                      <p className="text-2xl font-bold text-white">
                        {getTotalHours(selectedPlan.subjects)}s
                      </p>
                    </div>
                  </div>
                </div>
                <div className="gradient-card p-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2.5 rounded-xl",
                        selectedPlan.status === "active"
                          ? "bg-emerald-500/20"
                          : "bg-slate-500/20"
                      )}
                    >
                      {selectedPlan.status === "active" ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Durum</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mt-1",
                          selectedPlan.status === "active"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                        )}
                      >
                        {selectedPlan.status === "active" ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {selectedPlan.status === "active" ? "Aktif" : "Tamamlandı"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="gradient-card p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {selectedPlan.title}
                    </h2>
                    {selectedPlan.description && (
                      <p className="text-sm text-slate-400 mt-1">
                        {selectedPlan.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedPlan.subjects.map((subject, i) => (
                    <SubjectCard key={i} subject={subject} index={i} />
                  ))}
                </div>
              </div>

              <div className="gradient-card p-5 md:p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Haftalık Takvim
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                  {TR_DAYS.map((day, i) => {
                    const daySubjects = dayDistribution.get(i) || [];
                    return (
                      <div
                        key={day}
                        className={cn(
                          "rounded-xl border p-3 min-h-[140px] transition-all",
                          i === new Date().getDay() - 1 ||
                            (new Date().getDay() === 0 && i === 6)
                            ? "bg-purple-500/10 border-purple-500/30"
                            : "bg-slate-800/50 border-slate-700/50"
                        )}
                      >
                        <p
                          className={cn(
                            "text-xs font-semibold mb-3 text-center",
                            i === new Date().getDay() - 1 ||
                              (new Date().getDay() === 0 && i === 6)
                              ? "text-purple-400"
                              : "text-slate-400"
                          )}
                        >
                          {day}
                        </p>
                        <div className="space-y-2">
                          {daySubjects.length === 0 ? (
                            <p className="text-[10px] text-slate-600 text-center mt-4">
                              Boş
                            </p>
                          ) : (
                            daySubjects.map((s, j) => (
                              <div
                                key={j}
                                className={cn(
                                  "rounded-lg bg-gradient-to-r p-2 text-white text-[10px] font-medium leading-tight",
                                  getSubjectColor(s.name)
                                )}
                              >
                                <p className="truncate">{s.name}</p>
                                <p className="opacity-75 text-[9px]">
                                  {s.hours}s
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="gradient-card p-5 md:p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Ders Bazlı İlerleme
                </h2>
                <div className="space-y-4">
                  {selectedPlan.subjects.map((subject, i) => (
                    <ProgressRow key={i} subject={subject} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-400 mb-3">
                  Tüm Planlar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={cn(
                        "text-left rounded-xl border p-4 transition-all hover:scale-[1.01]",
                        selectedPlan?.id === plan.id
                          ? "bg-purple-500/10 border-purple-500/30"
                          : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-white truncate">
                          {plan.title}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium",
                            plan.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-600/20 text-slate-500"
                          )}
                        >
                          {plan.status === "active" ? "Aktif" : "Tamamlandı"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDateTR(new Date(plan.week_start))}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {plan.subjects.length} ders ·{" "}
                        {getTotalHours(plan.subjects)} saat
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function SubjectCard({ subject, index }: { subject: Subject; index: number }) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 hover:border-slate-600 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "w-2 h-8 rounded-full bg-gradient-to-b shrink-0",
            getSubjectColor(subject.name)
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">
            {subject.name}
          </p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {subject.hours} saat
          </p>
        </div>
      </div>
      {subject.topics.length > 0 && (
        <div className="space-y-1.5">
          {subject.topics.map((topic, j) => (
            <div key={j} className="flex items-start gap-2">
              <Circle className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-400 leading-relaxed">{topic}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressRow({ subject }: { subject: Subject }) {
  const [completed, setCompleted] = useState(false);

  const topicCount = subject.topics.length;
  const progress = completed ? 100 : 0;

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
      <button
        onClick={() => setCompleted(!completed)}
        className="shrink-0"
      >
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <Circle className="w-5 h-5 text-slate-500 hover:text-slate-400 transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p
            className={cn(
              "text-sm font-medium truncate",
              completed ? "text-emerald-400" : "text-white"
            )}
          >
            {subject.name}
          </p>
          <span className="text-xs text-slate-500 shrink-0 ml-2">
            {subject.hours} saat · {topicCount} konu
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              completed
                ? "bg-gradient-to-r from-emerald-500 to-green-400 w-full"
                : "bg-slate-600 w-0"
            )}
          />
        </div>
      </div>
    </div>
  );
}
