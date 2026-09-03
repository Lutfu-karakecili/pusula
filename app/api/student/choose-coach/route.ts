import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { coach_id } = await req.json();
  if (!coach_id) return NextResponse.json({ error: "coach_id gerekli." }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });

  // Check coach quota
  const { data: coach } = await supabase.from("profiles").select("student_quota").eq("id", coach_id).single();
  if (!coach) return NextResponse.json({ error: "Koç bulunamadı." }, { status: 404 });

  const { count } = await supabase.from("students").select("*", { count: "exact", head: true }).eq("coach_id", coach_id);

  if (coach.student_quota > 0 && (count ?? 0) >= coach.student_quota) {
    return NextResponse.json({ error: "Kontenjan dolu." }, { status: 400 });
  }

  const { error } = await supabase.from("students").update({ coach_id }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
