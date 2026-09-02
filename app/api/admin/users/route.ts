import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assert-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/users — tüm kullanıcıları (profiles) listeler
export async function GET() {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz." }, { status: auth.status });

  const { data, error } = await auth.supabase
    .from("profiles")
    .select("*, students(coach_id)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

// POST /api/admin/users — yeni kullanıcı oluşturur (admin/coach/student)
export async function POST(req: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz." }, { status: auth.status });

  const body = await req.json();
  const { email, password, full_name, role, phone } = body as {
    email: string; password: string; full_name: string; role: "admin" | "coach" | "student"; phone?: string;
  };

  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: "Eksik alan(lar) var." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (phone && created.user) {
    await admin.from("profiles").update({ phone } as any).eq("id", created.user.id);
  }

  return NextResponse.json({ data: created.user }, { status: 201 });
}
