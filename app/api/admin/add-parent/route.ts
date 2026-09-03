import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/assert-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await assertAdmin();
  if (!auth.ok) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: auth.status });

  const admin = createAdminClient();
  const body = await request.json();
  const { student_id, email } = body;

  if (!student_id || !email) {
    return NextResponse.json({ error: "Öğrenci ID ve e-posta gerekli." }, { status: 400 });
  }

  // Bu e-postayla profil var mı?
  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  let parentId: string | null = existing?.id ?? null;

  if (!parentId) {
    // Yeni veli hesabı aç
    const password = `${Math.floor(10000 + Math.random() * 90000)}abc`;
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: email.split("@")[0], role: "parent" },
    });

    if (createError) {
      return NextResponse.json({ error: `Veli hesabı oluşturulamadı: ${createError.message}` }, { status: 500 });
    }

    parentId = created.user!.id;

    // Profile kaydı oluştur
    const { error: profileError } = await admin.from("profiles").upsert({
      id: parentId,
      role: "parent",
      full_name: email.split("@")[0],
      email,
    }, { onConflict: "id" });

    if (profileError) {
      return NextResponse.json({ error: `Profil oluşturulamadı: ${profileError.message}` }, { status: 500 });
    }

    // Veli-öğrenci bağlantısı kur
    const { error: linkError } = await admin.from("parent_student_links").insert({
      parent_id: parentId,
      student_id,
    });

    if (linkError) {
      return NextResponse.json({ error: `Bağlantı kurulamadı: ${linkError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, password, parent_id: parentId }, { status: 201 });
  }

  // Mevcut veli varsa sadece bağla
  const { error: linkError } = await admin.from("parent_student_links").insert({
    parent_id: parentId,
    student_id,
  });

  if (linkError) {
    return NextResponse.json({ error: `Bağlantı kurulamadı: ${linkError.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, parent_id: parentId });
}
