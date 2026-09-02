"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getWeekDates,
  formatDate,
  SUBJECTS,
} from "@/lib/utils";
import type { Profile, Student, Plan, SubjectPlan } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Circle,
} from "lucide-react";

export default function StudentPlanningPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(
    {}
  );
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
        const { data: planData } = await supabase
          .from("plans")
          .select("*")
          .eq("student_id", studentData.id)
          .order("week_start", { ascending: false });
        setPlans(planData || []);

        const active = planData?.find((p) => p.status === "active") || null;
        setActivePlan(active);

        if (active) {
          setCompletedTasks(active.completed_tasks || {});
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const weekDays = getWeekDates(currentWeekStart);
  const weekLabel = `${weekDays[0].getDate()} ${weekDays[0].toLocaleDateString("tr-TR", { month: "long" })} - ${weekDays[6].getDate()} ${weekDays[6].toLocaleDateString("tr-TR", { month: "long" })}`;

  const navigateWeek = (dir: number) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + dir * 7);
    setCurrentWeekStart(newDate);
  };

  const toggleTask = (subject: string, day: number, topic: string) => {
    const key = `${subject}-${day}-${topic}`;
    setCompletedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getProgress = () => {
    if (!activePlan) return 0;
    let total = 0;
    let completed = 0;
    activePlan.subjects?.forEach((sub) => {
      sub.days.forEach((day) => {
        sub.topics.forEach((topic) => {
          total++;
          const key = `${sub.subject}-${day}-${topic}`;
          if (completedTasks[key]) completed++;
        });
      });
    });
    return total > 0 ? Math.round((completed / total) * 100) : 0;
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
          <h1 className="text-2xl md:text-3xl font-bold">Haftalık Planım</h1>
          <p className="text-muted-foreground">
            Koçunun hazırladık planı takip et
          </p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium">{weekLabel}</p>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        {activePlan && (
          <Card className="bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 border-indigo-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Haftalık İlerleme</p>
                <p className="text-sm font-bold">%{getProgress()}</p>
              </div>
              <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Info */}
        {activePlan && (
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm">{activePlan.title}</p>
              <p className="text-xs text-muted-foreground">
                {activePlan.description}
              </p>
            </div>
          </div>
        )}

        {/* Subject Cards */}
        {activePlan?.subjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlan.subjects.map((sub, idx) => (
              <Card key={idx} className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{sub.subject}</CardTitle>
                    <Badge variant="info">{sub.duration_min} dk</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sub.topics.map((topic, tIdx) => (
                      <div key={tIdx}>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                          <p className="text-sm">{topic}</p>
                          <div className="flex gap-1">
                            {sub.days.map((day) => {
                              const key = `${sub.subject}-${day}-${topic}`;
                              const isCompleted = completedTasks[key];
                              return (
                                <button
                                  key={day}
                                  onClick={() =>
                                    toggleTask(sub.subject, day, topic)
                                  }
                                  className="p-1 hover:bg-muted/50 rounded transition-colors"
                                  title={
                                    [
                                      "Pzt",
                                      "Sal",
                                      "Çar",
                                      "Per",
                                      "Cum",
                                      "Cmt",
                                      "Paz",
                                    ][day] || ""
                                  }
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Bu hafta için aktif bir plan bulunmuyor
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Koçunuz yakında bir plan paylaşacak
              </p>
            </CardContent>
          </Card>
        )}

        {/* 7-Day Calendar View */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Günlük Görünüm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
              {weekDays.map((day, i) => {
                const isToday =
                  day.toDateString() === new Date().toDateString();
                const dayTasks = activePlan?.subjects
                  ?.filter((sub) => sub.days.includes(i))
                  .flatMap((sub) =>
                    sub.topics.map((t) => ({ subject: sub.subject, topic: t }))
                  );
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border ${
                      isToday
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/20 border-border/50"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground text-center">
                      {day.toLocaleDateString("tr-TR", { weekday: "short" })}
                    </p>
                    <p
                      className={`text-lg font-bold text-center mt-1 ${
                        isToday ? "text-primary" : ""
                      }`}
                    >
                      {day.getDate()}
                    </p>
                    <div className="mt-2 space-y-1">
                      {dayTasks?.slice(0, 2).map((task, tIdx) => (
                        <div
                          key={tIdx}
                          className="text-xs p-1 bg-muted/50 rounded truncate"
                          title={`${task.subject}: ${task.topic}`}
                        >
                          {task.subject}
                        </div>
                      ))}
                      {dayTasks && dayTasks.length > 2 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{dayTasks.length - 2}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Past Plans */}
        {plans.filter((p) => p.status === "completed").length > 0 && (
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Geçmiş Planlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {plans
                  .filter((p) => p.status === "completed")
                  .slice(0, 3)
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{plan.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(plan.week_start)} haftası
                        </p>
                      </div>
                      <Badge variant="success">Tamamlandı</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
