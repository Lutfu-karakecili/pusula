import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assert-admin";

export async function GET() {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz." }, { status: auth.status });

  const { data, error } = await auth.supabase
    .from("meetings")
    .select("*, student:students(profile:profiles(full_name)), coach:profiles!meetings_coach_id_fkey(full_name)")
    .order("scheduled_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
