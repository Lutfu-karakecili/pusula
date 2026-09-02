"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Student, Plan, Homework, Meeting, DashboardStats, Profile } from "@/lib/types";
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
  BarChart3,
} from "lucide-react";

export default function CoachDashboardPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
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

      const [studentsRes, plansRes, homeworkRes, meetingsRes] =
        await Promise.all([
          supabase
            .from("students")
            .select("*, profiles!students_user_id_fkey(*)")
            .eq("coach_id", coachId)
            .order("created_at", { ascending: false }),
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
              "meeting_date",
              new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toISOString()
            )
            .lte("meeting_date", new Date().toISOString()),
        ]);

      setStudents(studentsRes.data || []);
      setStats({
        totalStudents: studentsRes.data?.length || 0,
        activePlans: plansRes.count || 0,
        pendingHomework: homeworkRes.count || 0,
        weeklyMeetings: meetingsRes.count || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredStudents = students.filter((s) => {
    const name = s.profiles?.full_name?.toLowerCase() || "";
    const email = s.profiles?.email?.toLowerCase() || "";
    return (
      name.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase())
    );
  });

  if (loading) {
    return (
      <DashboardLayout role="coach" userName={profile?.full_name || "Koç"}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Koç"}>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Hoş Geldin,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {profile?.full_name?.split(" ")[0] || "Koç"}
              </span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Bugünkü durumuna genel bir bakış
            </p>
          </div>
          <div className="text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg border">
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
            icon={<Users className="h-6 w-6" />}
            gradient="purple"
            trend="up"
            trendValue={`${stats.totalStudents} aktif`}
          />
          <StatCard
            title="Aktif Planlar"
            value={stats.activePlans}
            icon={<CalendarCheck className="h-6 w-6" />}
            gradient="green"
          />
          <StatCard
            title="Bekleyen Ödev"
            value={stats.pendingHomework}
            icon={<BookOpen className="h-6 w-6" />}
            gradient="orange"
          />
          <StatCard
            title="Bu Haftaki Görüşme"
            value={stats.weeklyMeetings}
            icon={<Video className="h-6 w-6" />}
            gradient="blue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-indigo-400" />
                    Öğrencilerim
                  </CardTitle>
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ara..."
                      className="pl-9 w-full sm:w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
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
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border hover:border-indigo-500/30 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {student.profiles?.avatar_url ? (
                              <img
                                src={student.profiles.avatar_url}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              getInitials(student.profiles?.full_name || "Ö")
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {student.profiles?.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.grade && `Sınıf ${student.grade} `}
                              {student.target_score &&
                                `• Hedef: ${student.target_score} puan`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Link href={`/coach/student/${student.user_id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Profili Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredStudents.length > 0 && (
                  <div className="mt-4">
                    <Link href="/coach/planning">
                      <Button variant="outline" className="w-full">
                        Tüm Öğrencileri Gör
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Yaklaşan Görüşmeler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 rounded-lg bg-muted/20 border border-dashed">
                  <Video className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Yakında planlanmış görüşme yok
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-indigo-600/10 border-indigo-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-indigo-400" />
                  Hızlı İşlemler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/coach/planning">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border text-left hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Yeni Plan Oluştur
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Çalışma planı hazırla
                      </p>
                    </div>
                  </button>
                </Link>
                <Link href="/coach/homework">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border text-left hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Ödev Oluştur
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ödev ata ve takip et
                      </p>
                    </div>
                  </button>
                </Link>
                <Link href="/coach/meetings">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 border text-left hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Görüşme Planla
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Video görüşme ayarla
                      </p>
                    </div>
                  </button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Haftalık İlerleme
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-48 rounded-lg bg-muted/20 border border-dashed">
                  <div className="text-center">
                    <BarChart3 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Haftalık İlerleme Grafiği
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      Yakında eklenecek
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
