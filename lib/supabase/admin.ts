import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ⚠️ YALNIZCA SUNUCU TARAFINDA (API route / server action) kullanılır.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
