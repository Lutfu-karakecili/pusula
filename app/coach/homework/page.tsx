import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { HomeworkClient } from "./homework-client";

export default async function CoachHomeworkPage() {
  const coach = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: students }, { data: homework }] = await Promise.all([
    supabase.from("students").select("id, profile:profiles!students_id_fkey(full_name)").eq("coach_id", coach.id),
    supabase.from("homework").select("*, student:students(profile:profiles(full_name))").eq("coach_id", coach.id).order("due_date", { ascending: true }),
  ]);

  return (
    <HomeworkClient
      students={(students ?? []) as any}
      homework={(homework ?? []) as any}
      coachId={coach.id}
    />
  );
}
