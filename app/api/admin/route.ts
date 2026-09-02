import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, full_name, role, phone } = await request.json();

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "Pusula2025!",
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (phone) {
    await supabase.from("profiles").update({ phone }).eq("id", data.user.id);
  }

  return NextResponse.json(data.user);
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, full_name, role, phone } = await request.json();

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, role, phone, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await request.json();

  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
