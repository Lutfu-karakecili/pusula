import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısınız." }, { status: 401 });

  const body = await request.json();
  const { new_coach_id } = body;

  if (!new_coach_id) return NextResponse.json({ error: "Koç ID gerekli." }, { status: 400 });

  // Mevcut öğrenciyi çek
  const { data: student } = await supabase
    .from("students")
    .select("coach_id, id")
    .eq("id", user.id)
    .single();

  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı." }, { status: 404 });

  // Aynı koç ise hata
  if (student.coach_id === new_coach_id) {
    return NextResponse.json({ error: "Zaten bu koçla eşleşmişsiniz." }, { status: 400 });
  }

  // Yeni koçun kontenjanı dolu mu?
  const { data: coachProfile } = await supabase
    .from("profiles")
    .select("student_quota")
    .eq("id", new_coach_id)
    .single();

  if (coachProfile && coachProfile.student_quota > 0) {
    const { count } = await supabase
      .from("student_coaches")
      .select("*", { count: "exact", head: true })
      .eq("coach_id", new_coach_id);

    if (count && count >= coachProfile.student_quota) {
      return NextResponse.json({ error: "Seçtiğiniz koçun kontenjanı dolu." }, { status: 400 });
    }
  }

  const oldCoachId = student.coach_id;

  // Koç değiştir
  const { error: updateError } = await supabase
    .from("students")
    .update({ coach_id: new_coach_id })
    .eq("id", user.id);

  if (updateError) return NextResponse.json({ error: "Koç güncellenemedi." }, { status: 500 });

  // student_coaches tablosunu güncelle
  if (oldCoachId) {
    await supabase.from("student_coaches").delete().eq("student_id", user.id).eq("coach_id", oldCoachId);
  }
  await supabase.from("student_coaches").insert({ student_id: user.id, coach_id: new_coach_id });

  // Geçmişe kaydet
  await supabase.from("coach_change_history").insert({
    student_id: user.id,
    old_coach_id: oldCoachId,
    new_coach_id,
  });

  return NextResponse.json({ success: true });
}
