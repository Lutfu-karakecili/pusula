import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createZoomMeeting } from "@/lib/zoom";

// POST /api/meetings — koç (veya admin) yeni bir görüşme planlar; Zoom
// toplantısı otomatik oluşturulup join/start linkleri kaydedilir.
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (!profile || (profile.role !== "coach" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Sadece koç veya admin görüşme planlayabilir." }, { status: 403 });
  }

  const body = await req.json();
  const { student_id, title, scheduled_at, duration_minutes, agenda } = body as {
    student_id: string; title: string; scheduled_at: string; duration_minutes: number; agenda?: string;
  };

  if (!student_id || !scheduled_at) {
    return NextResponse.json({ error: "student_id ve scheduled_at zorunludur." }, { status: 400 });
  }

  let zoom;
  try {
    zoom = await createZoomMeeting({
      topic: title || "Koçluk Görüşmesi",
      startTimeISO: scheduled_at,
      durationMinutes: duration_minutes || 45,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Zoom hatası." }, { status: 502 });
  }

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      student_id,
      coach_id: user.id,
      title: title || "Koçluk Görüşmesi",
      scheduled_at,
      duration_minutes: duration_minutes || 45,
      agenda: agenda ?? null,
      zoom_meeting_id: zoom.id,
      zoom_join_url: zoom.join_url,
      zoom_start_url: zoom.start_url,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
