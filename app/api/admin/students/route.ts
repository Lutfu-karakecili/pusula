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

// PATCH /api/admin/students — öğrenci güncelle (koç atama, doğrulama durumu vb.)
export async function PATCH(request: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz." }, { status: auth.status });

  const body = await request.json();
  const { id, coach_id, verification_status } = body ?? {};
  if (!id) return NextResponse.json({ error: "id gerekli." }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (coach_id !== undefined) patch.coach_id = coach_id || null;
  if (verification_status !== undefined) patch.verification_status = verification_status;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("students").update(patch).eq("id", id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}
