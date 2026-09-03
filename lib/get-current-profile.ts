import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Student } from "@/lib/database.types";

export async function getCurrentProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) return profile as Profile;

  const fullName =
    ((user.user_metadata as Record<string, unknown>)?.full_name as string) ||
    user.email?.split("@")[0] ||
    "Kullanıcı";

  const role =
    ((user.user_metadata as Record<string, unknown>)?.role as string) || "student";

  const { data: created, error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, role, full_name: fullName, email: user.email ?? "" },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("[getCurrentProfile] upsert failed:", error.message, error.code);
    throw new Error(
      `Profil otomatik oluşturulamadı (RLS policy eksik olabilir). Kullanıcı: ${user.id}, Hata: ${error.message}`
    );
  }

  return created as Profile;
}

export async function getCurrentStudent(): Promise<Student & { profile: Profile }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();

  const { data: student } = await supabase
    .from("students")
    .select("*, profile:profiles(*)")
    .eq("id", profile.id)
    .maybeSingle();

  if (student) return student as unknown as Student & { profile: Profile };

  const { data: created, error } = await supabase
    .from("students")
    .upsert({ id: profile.id }, { onConflict: "id" })
    .select("*, profile:profiles(*)")
    .single();

  if (error) {
    console.error("[getCurrentStudent] upsert failed:", error.message, error.code);
    throw new Error(
      `Öğrenci kaydı oluşturulamadı. Profil: ${profile.id}, Hata: ${error.message}`
    );
  }

  return created as unknown as Student & { profile: Profile };
}
