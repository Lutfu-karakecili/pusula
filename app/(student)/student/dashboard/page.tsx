"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, getWeekDates } from "@/lib/utils";
import type { Profile, Student, Homework, Meeting, Plan } from "@/lib/types";
import {
  Target,
  TrendingUp,
  BookOpen,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
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
        const { data: hw } = await supabase
          .from("homework")
          .select("*")
          .eq("student_id", studentData.id)
          .order("due_date", { ascending: true });
        setHomework(hw || []);

        const { data: mt } = await supabase
          .from("meetings")
          .select("*")
          .eq("student_id", studentData.id)
          .order("meeting_date", { ascending: true });
        setMeetings(mt || []);

        const { data: pl } = await supabase
          .from("plans")
          .select("*")
          .eq("student_id", studentData.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        setActivePlan(pl);
      }
      setLoading(false);
    }
    init();
  }, []);

  const activeHomework = homework.filter(
    (h) => h.status === "pending" || h.status === "in_progress"
  );
  const upcomingMeetings = meetings.filter(
    (m) => m.status === "scheduled" && new Date(m.meeting_date) > new Date()
  );

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekDays = getWeekDates(weekStart);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <DashboardLayout role="student" userName={profile?.full_name || "Öğrenci"}>
      <div className="space-y-6">
        {/* Greeting */}
        <div className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 border border-indigo-500/20 rounded-xl p-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Merhaba, {profile?.full_name?.split(" ")[0] || "Öğrenci"} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Bugün de hedefine bir adım daha yaklaş!
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Hedef Puan"
            value={student?.target_score || 0}
            icon={<Target className="h-6 w-6" />}
            gradient="purple"
          />
          <StatCard
            title="Mevcut Puan"
            value={student?.current_score || 0}
            icon={<TrendingUp className="h-6 w-6" />}
            gradient="green"
            trend={
              student && student.current_score > 0 ? "up" : undefined
            }
            trendValue={
              student
                ? `${student.current_score} / ${student.target_score}`
                : undefined
            }
          />
          <StatCard
            title="Aktif Ödev"
            value={activeHomework.length}
            icon={<BookOpen className="h-6 w-6" />}
            gradient="orange"
          />
          <StatCard
            title="Yaklaşan Toplantı"
            value={upcomingMeetings.length}
            icon={<Calendar className="h-6 w-6" />}
            gradient="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Plan Summary */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Haftalık Plan Özeti</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/student/planning">
                    Tümünü Gör <ArrowRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activePlan ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, i) => {
                      const dayName = day.toLocaleDateString("tr-TR", {
                        weekday: "short",
                      });
                      const isToday =
                        day.toDateString() === new Date().toDateString();
                      return (
                        <div key={i} className="text-center">
                          <p className="text-xs text-muted-foreground">
                            {dayName}
                          </p>
                          <p
                            className={`text-sm font-medium mt-1 p-2 rounded-lg ${
                              isToday
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50"
                            }`}
                          >
                            {day.getDate()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {activePlan.subjects?.slice(0, 3).map((sub, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{sub.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.topics.length} konu • {sub.duration_min} dk
                        </p>
                      </div>
                      <Badge variant="info">{sub.days.length} gün</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Henüz aktif plan bulunmuyor</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Homework */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Yaklaşan Ödevler</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/student/homework">
                    Tümünü Gör <ArrowRight className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {homework
                  .filter((h) => h.status !== "completed")
                  .slice(0, 5)
                  .map((hw) => (
                    <div
                      key={hw.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {hw.status === "overdue" ? (
                          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                        ) : hw.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{hw.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {hw.subject} •{" "}
                            {formatDate(hw.due_date)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          hw.status === "overdue"
                            ? "destructive"
                            : hw.status === "completed"
                            ? "success"
                            : hw.status === "in_progress"
                            ? "info"
                            : "warning"
                        }
                      >
                        {hw.status === "overdue"
                          ? "Gecikmiş"
                          : hw.status === "completed"
                          ? "Tamamlandı"
                          : hw.status === "in_progress"
                          ? "Devam Ediyor"
                          : "Bekliyor"}
                      </Badge>
                    </div>
                  ))}
                {homework.filter((h) => h.status !== "completed").length ===
                  0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Tüm ödevler tamamlanmış!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <a href="/student/planning">
                <div className="p-4 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-xl hover:from-indigo-600/20 hover:to-purple-600/20 transition-all cursor-pointer text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-indigo-400" />
                  <p className="text-sm font-medium">Haftalık Plan</p>
                </div>
              </a>
              <a href="/student/homework">
                <div className="p-4 bg-gradient-to-br from-orange-600/10 to-amber-600/10 border border-orange-500/20 rounded-xl hover:from-orange-600/20 hover:to-amber-600/20 transition-all cursor-pointer text-center">
                  <BookOpen className="h-6 w-6 mx-auto mb-2 text-orange-400" />
                  <p className="text-sm font-medium">Ödevlerim</p>
                </div>
              </a>
              <a href="/student/ai">
                <div className="p-4 bg-gradient-to-br from-emerald-600/10 to-green-600/10 border border-emerald-500/20 rounded-xl hover:from-emerald-600/20 hover:to-green-600/20 transition-all cursor-pointer text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm font-medium">AI Asistan</p>
                </div>
              </a>
              <a href="/student/meetings">
                <div className="p-4 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-xl hover:from-blue-600/20 hover:to-cyan-600/20 transition-all cursor-pointer text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm font-medium">Toplantılar</p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
