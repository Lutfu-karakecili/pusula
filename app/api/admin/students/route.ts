import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assert-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/students
export async function GET() {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz." }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("students")
    .select("*, profile:profiles!students_id_fkey(full_name, email, avatar_url)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
