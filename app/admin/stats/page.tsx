"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/stat-card";
import { ChartContainer } from "@/components/chart";
import { createClient } from "@/lib/supabase";
import { cn, formatDate } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  UserCheck,
  CalendarCheck,
  BookOpen,
  Video,
  PieChart,
  Activity,
  UserPlus,
  ClipboardList,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "user_added" | "plan_created" | "homework_completed" | "meeting" | "note";
  message: string;
  time: string;
  icon: React.ElementType;
  color: string;
}

const activityIconColor: Record<string, { icon: React.ElementType; color: string }> = {
  user_added: { icon: UserPlus, color: "text-emerald-400" },
  plan_created: { icon: ClipboardList, color: "text-purple-400" },
  homework_completed: { icon: CheckCircle2, color: "text-pink-400" },
  meeting: { icon: Video, color: "text-blue-400" },
  note: { icon: MessageSquare, color: "text-orange-400" },
};

export default function AdminStats() {
  const supabase = createClient();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCoaches: 0,
    activePlans: 0,
    totalHomework: 0,
    totalMeetings: 0,
  });
  const [roleDistribution, setRoleDistribution] = useState([
    { role: "admin", count: 0 },
    { role: "coach", count: 0 },
    { role: "student", count: 0 },
  ]);
  const [coachChart, setCoachChart] = useState<{
    labels: string[];
    data: number[];
  }>({ labels: [], data: [] });
  const [weeklyRegistrations, setWeeklyRegistrations] = useState<{
    labels: string[];
    data: number[];
  }>({ labels: [], data: [] });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchCharts(), fetchActivities()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: studentCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    const { count: coachCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "coach");

    const { count: planCount } = await supabase
      .from("plans")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { count: homeworkCount } = await supabase
      .from("homework")
      .select("*", { count: "exact", head: true });

    const { count: meetingCount } = await supabase
      .from("meetings")
      .select("*", { count: "exact", head: true });

    const { data: roleData } = await supabase
      .from("profiles")
      .select("role");

    const roleCounts = { admin: 0, coach: 0, student: 0 };
    if (roleData) {
      roleData.forEach((p) => {
        if (p.role in roleCounts) roleCounts[p.role as keyof typeof roleCounts] += 1;
      });
    }

    setStats({
      totalUsers: userCount || 0,
      totalStudents: studentCount || 0,
      totalCoaches: coachCount || 0,
      activePlans: planCount || 0,
      totalHomework: homeworkCount || 0,
      totalMeetings: meetingCount || 0,
    });
    setRoleDistribution([
      { role: "admin", count: roleCounts.admin },
      { role: "coach", count: roleCounts.coach },
      { role: "student", count: roleCounts.student },
    ]);
  };

  const fetchCharts = async () => {
    const { data: coaches } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "coach");

    const labels: string[] = [];
    const data: number[] = [];

    if (coaches) {
      for (const coach of coaches) {
        const { count } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("coach_id", coach.id);
        labels.push(coach.full_name || "İsimsiz");
        data.push(count || 0);
      }
    }

    const weekLabels: string[] = [];
    const weekData: number[] = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7) - i * 7 + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString())
        .lt("created_at", weekEnd.toISOString());

      weekLabels.push(
        `${weekStart.getDate()}.${weekStart.getMonth() + 1}`
      );
      weekData.push(count || 0);
    }

    setCoachChart({ labels, data });
    setWeeklyRegistrations({ labels: weekLabels, data: weekData });
  };

  const fetchActivities = async () => {
    const recentProfiles = await supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentPlans = await supabase
      .from("plans")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentHomework = await supabase
      .from("homework")
      .select("id, title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const items: ActivityItem[] = [];

    if (recentProfiles.data) {
      recentProfiles.data.forEach((p) => {
        items.push({
          id: `profile-${p.id}`,
          type: "user_added",
          message: `${p.full_name || "Yeni kullanıcı"} kayıt oldu (${p.role})`,
          time: p.created_at,
          icon: activityIconColor.user_added.icon,
          color: activityIconColor.user_added.color,
        });
      });
    }

    if (recentPlans.data) {
      recentPlans.data.forEach((p) => {
        items.push({
          id: `plan-${p.id}`,
          type: "plan_created",
          message: `Yeni plan oluşturuldu: ${p.title}`,
          time: p.created_at,
          icon: activityIconColor.plan_created.icon,
          color: activityIconColor.plan_created.color,
        });
      });
    }

    if (recentHomework.data) {
      recentHomework.data.forEach((h) => {
        items.push({
          id: `homework-${h.id}`,
          type: "homework_completed",
          message: `Ödev ${h.status}: ${h.title}`,
          time: h.created_at,
          icon:
            activityIconColor[
              h.status === "completed" ? "homework_completed" : "plan_created"
            ].icon,
          color:
            activityIconColor[
              h.status === "completed" ? "homework_completed" : "plan_created"
            ].color,
        });
      });
    }

    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivities(items.slice(0, 10));
  };

  const totalRoleCount =
    roleDistribution.reduce((sum, r) => sum + r.count, 0) || 1;

  const roleColors: Record<string, string> = {
    admin: "bg-red-500",
    coach: "bg-blue-500",
    student: "bg-emerald-500",
  };

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      <Sidebar />

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Platform İstatistikleri
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              PUSULA platform genel analizleri
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl bg-slate-900/50 border border-slate-800 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Toplam Kullanıcı"
                value={stats.totalUsers}
                description="Tüm platform kullanıcıları"
                icon={Users}
                gradient="purple"
              />
              <StatCard
                title="Toplam Öğrenci"
                value={stats.totalStudents}
                description="Kayıtlı öğrenci sayısı"
                icon={GraduationCap}
                gradient="blue"
              />
              <StatCard
                title="Toplam Koç"
                value={stats.totalCoaches}
                description="Aktif koç sayısı"
                icon={UserCheck}
                gradient="green"
              />
              <StatCard
                title="Aktif Planlar"
                value={stats.activePlans}
                description="Aktif haftalık planlar"
                icon={CalendarCheck}
                gradient="orange"
              />
              <StatCard
                title="Toplam Ödev"
                value={stats.totalHomework}
                description="Oluşturulan ödevler"
                icon={BookOpen}
                gradient="pink"
              />
              <StatCard
                title="Görüşme Sayısı"
                value={stats.totalMeetings}
                description="Toplam yapılan görüşmeler"
                icon={Video}
                gradient="blue"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              type="bar"
              title="Koç Başına Öğrenci"
              labels={coachChart.labels}
              datasets={[
                {
                  label: "Öğrenci Sayısı",
                  data: coachChart.data,
                  backgroundColor: "rgba(139,92,246,0.5)",
                },
              ]}
            />
            <ChartContainer
              type="line"
              title="Haftalık Kayıtlar (Son 4 Hafta)"
              labels={weeklyRegistrations.labels}
              datasets={[
                {
                  label: "Yeni Kayıt",
                  data: weeklyRegistrations.data,
                  borderColor: "rgba(59,130,246,1)",
                  backgroundColor: "rgba(59,130,246,0.2)",
                },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-5">
                <PieChart className="w-5 h-5 text-purple-400" />
                Rol Dağılımı
              </h2>
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-44 h-44">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(
                        #ef4444 0% ${(roleDistribution[0].count / totalRoleCount) * 100}%,
                        #3b82f6 ${(roleDistribution[0].count / totalRoleCount) * 100}% ${((roleDistribution[0].count + roleDistribution[1].count) / totalRoleCount) * 100}%,
                        #10b981 ${((roleDistribution[0].count + roleDistribution[1].count) / totalRoleCount) * 100}% 100%
                      )`,
                    }}
                  />
                  <div className="absolute inset-4 rounded-full bg-slate-900 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {stats.totalUsers}
                    </span>
                  </div>
                </div>
                <div className="w-full space-y-2">
                  {roleDistribution.map((r) => (
                    <div
                      key={r.role}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-3 h-3 rounded-full",
                            roleColors[r.role]
                          )}
                        />
                        <span className="text-slate-300 capitalize">{r.role}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-medium">{r.count}</span>
                        <span className="text-slate-500 w-12 text-right">
                          %{Math.round((r.count / totalRoleCount) * 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/50 border border-slate-800 overflow-hidden">
              <div className="p-4 md:p-5 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Son Aktiviteler
                </h2>
              </div>
              <div className="divide-y divide-slate-800/50 max-h-[420px] overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    Henüz aktivite bulunmuyor.
                  </div>
                ) : (
                  activities.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="px-4 md:px-5 py-3.5 hover:bg-slate-800/20 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg bg-slate-800/50 shrink-0",
                              item.color
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-200 leading-snug">
                              {item.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDate(item.time)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
