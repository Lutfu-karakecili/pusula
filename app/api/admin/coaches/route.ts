import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assert-admin";

// GET /api/admin/coaches — her koçun öğrenci sayısıyla birlikte listesi
export async function GET() {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz." }, { status: auth.status });

  const { data: coaches, error } = await auth.supabase
    .from("profiles")
    .select("*, students:students!students_coach_id_fkey(id)")
    .eq("role", "coach")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: coaches });
}
