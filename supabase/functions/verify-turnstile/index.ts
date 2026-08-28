// supabase/functions/verify-turnstile/index.ts
//
// Cloudflare Turnstile token'ını SUNUCU tarafında doğrulayan Supabase Edge
// Function. Client yalnızca token'ı gönderir; secret key burada (ortam
// değişkeninde) saklanır, asla cliente sızmaz.
//
// Dağıtım:
//   supabase functions deploy verify-turnstile
//
// Gerekli ortam değişkenleri (Supabase Dashboard > Edge Functions > Secrets
// VE Vercel/Project Environment):
//   SECRET_TURNSTILE_KEY      -> Cloudflare Turnstile secret key
//   SUPABASE_URL              -> Proje URL'si
//   SUPABASE_SERVICE_ROLE_KEY -> service_role key (bu fonksiyonda kullanılmaz
//                                ama okunarak erken başarısızlık sağlanır)
//
// İstemci: src/lib/server-verify.js -> verifyTurnstile(token)
//   Giriş : { token: string }
//   Çıkış : { ok: boolean }   (başarısızsa HTTP 403)

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || "unknown";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  // Ortam değişkenlerini erken doğrula (Supabase client örneği, ileride
  // genişletme için oluşturulur; bu fonksiyon token doğrulaması yapar).
  const secret = Deno.env.get("SECRET_TURNSTILE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRole) {
    return json({ ok: false, error: "Sunucu yapılandırması eksik." }, 500);
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false }, 403);
  }

  // Secret tanımsızsa (ör. local dev) doğrulamayı atla.
  if (!secret) {
    return json({ ok: true });
  }

  const token = body?.token;
  if (!token || token === "disabled") {
    return json({ ok: false }, 403);
  }

  const ip = clientIp(req);
  const params = new URLSearchParams({ secret, response: token });
  params.set("remoteip", ip);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (data.success) {
      return json({ ok: true });
    }
    return json({ ok: false }, 403);
  } catch {
    // Ağ/Cloudflare hatası -> güvenli tarafta reddet.
    return json({ ok: false }, 403);
  }
});
