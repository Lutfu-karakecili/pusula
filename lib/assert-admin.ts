import { createClient } from "@/lib/supabase/server";

export async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 as const, supabase };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as any)?.role !== "admin") return { ok: false as const, status: 403 as const, supabase };
  return { ok: true as const, supabase };
}
