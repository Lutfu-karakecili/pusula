import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { ParentDashboardClient } from "./parent-dashboard-client";

export default async function ParentDashboardPage() {
  await getCurrentProfile();
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("parent_student_links")
    .select("student_id, student:students!parent_student_links_student_id_fkey(*, profile:profiles!students_id_fkey(full_name, email))");

  const ids = (links ?? []).map((l: any) => l.student_id);
  const initialStudents = (links ?? []).map((l: any) => ({
    id: l.student_id,
    full_name: l.student?.profile?.full_name ?? "Öğrenci",
    grade: l.student?.grade,
  }));

  // Her öğrenci için verileri çek
  const data: Record<string, any> = {};
  for (const id of ids) {
    const [{ data: plan }, { data: homework }, { data: meetings }, { data: examSessions }] = await Promise.all([
      supabase.from("plans").select("*, plan_items(*)").eq("student_id", id).order("week_start", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("homework").select("*").eq("student_id", id).eq("status", "pending").order("due_date", { ascending: true }).limit(6),
      supabase.from("meetings").select("*").eq("student_id", id).eq("status", "scheduled").order("scheduled_at", { ascending: true }).limit(1).maybeSingle(),
      supabase.from("exam_sessions").select("net").eq("student_id", id).order("taken_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const planItems = plan?.plan_items ?? [];
    const done = planItems.filter((p: any) => p.status === "done").length;

    data[id] = {
      plan,
      homework: homework ?? [],
      pendingHomework: (homework ?? []).length,
      net: (examSessions as any)?.net ?? null,
      nextMeeting: meetings,
      planProgress: planItems.length ? Math.round((done / planItems.length) * 100) : 0,
      planDone: done,
      planTotal: planItems.length,
    };
  }

  return (
    <ParentDashboardClient initialStudents={initialStudents} initialData={data} />
  );
}
