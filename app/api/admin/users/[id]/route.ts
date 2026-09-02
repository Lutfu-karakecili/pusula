import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assert-admin";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH /api/admin/users/:id — profil bilgisi ve/veyarol günceller
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz." }, { status: auth.status });

  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .update({
      full_name: body.full_name,
      role: body.role,
      phone: body.phone ?? null,
    } as any)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (body.role === "student") {
    await admin.from("students").upsert({ id } as any, { onConflict: "id" });
  }

  return NextResponse.json({ data });
}

// DELETE /api/admin/users/:id — kullanıcıyı (auth + profil) tamamen siler
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz." }, { status: auth.status });

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
