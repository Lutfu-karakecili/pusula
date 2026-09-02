import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Student } from "@/lib/database.types";

// Server component'lerde kullanılan ortak yardımcı: oturum + profil bilgisini
// tek seferde döner. Middleware zaten rol bazlı erişimi filtrelediği için
// burada sadece veriyi çekiyoruz.
export async function getCurrentProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  return profile as Profile;
}

export async function getCurrentStudent(): Promise<Student & { profile: Profile }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const { data: student } = await supabase
    .from("students")
    .select("*, profile:profiles(*)")
    .eq("id", profile.id)
    .single();

  if (!student) redirect("/login");
  return student as unknown as Student & { profile: Profile };
}
