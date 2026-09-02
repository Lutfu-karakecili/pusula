import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assert-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/users
export async function GET() {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz." }, { status: auth.status });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

// POST /api/admin/users
export async function POST(req: Request) {
  try {
    const auth = await assertAdmin();
    if (!auth.ok) return NextResponse.json({ error: "Yetkisiz.", status: auth.status }, { status: auth.status });

    const body = await req.json();
    const { email, password, full_name, role } = body as {
      email: string; password: string; full_name: string; role: string;
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Trigger profile oluşturmayabilir, manuel ekle
    const { error: profileError } = await admin.from("profiles").upsert({
      id: created.user!.id,
      role,
      full_name,
      email,
    }, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json({ error: "Profil oluşturulamadı: " + profileError.message }, { status: 400 });
    }

    // Role student ise students tablosuna da ekle
    if (role === "student") {
      await admin.from("students").upsert({ id: created.user!.id }, { onConflict: "id" });
    }

    return NextResponse.json({ data: created.user }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Bilinmeyen hata" }, { status: 500 });
  }
}
