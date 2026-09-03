import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { MeetingsClient } from "./meetings-client";

export default async function CoachMeetingsPage() {
  const coach = await getCurrentProfile();
  const supabase = await createClient();

  const [{ data: students }, { data: meetings }] = await Promise.all([
    supabase.from("students").select("id, profile:profiles!students_id_fkey(full_name)").eq("coach_id", coach.id),
    supabase.from("meetings").select("*, student:students(profile:profiles(full_name))").eq("coach_id", coach.id).order("scheduled_at", { ascending: false }),
  ]);

  return (
    <MeetingsClient
      students={(students ?? []) as any}
      meetings={(meetings ?? []) as any}
    />
  );
}
