// supabase/functions/contact-guard/index.ts
//
// İletişim formu gönderimini spam'e karşı koruyan Supabase Edge Function:
//   1) Aynı gönderici e-postası için son 10 dakikadaki kayıt sayısını
//      (rate-limit) denetler.
//   2) (Savunma katmanı) Turnstile token'ı varsa sunucu tarafında doğrular.
//   3) Geçerli ise service_role client ile messages tablosuna INSERT yapar.
//
// Dağıtım:
//   supabase functions deploy contact-guard
//
// Gerekli ortam değişkenleri (Supabase Dashboard > Edge Functions > Secrets
// VE Vercel/Project Environment):
//   SECRET_TURNSTILE_KEY      -> Cloudflare Turnstile secret key
//   SUPABASE_URL              -> Proje URL'si
//   SUPABASE_SERVICE_ROLE_KEY -> service_role key (RLS'i bypass eder)
//
// İstemci: src/lib/server-verify.js -> submitContact(payload)
//   Giriş : { name|sender_name, email|sender_email, phone|sender_phone,
//             subject, message|body, token? }
//   Çıkış : { success: true, id }  |  hata durumunda JSON + uygun HTTP

import { createClient } from "jsr:@supabase/supabase-js@2";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const RATE_LIMIT = 5; // aynı e-posta için izin verilen max gönderim
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 dakika

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

function validate(p: {
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  body?: string;
}): string | null {
  if (!p.sender_name || p.sender_name.trim().length < 2) return "Ad alanı geçersiz.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.sender_email || ""))
    return "E-posta geçersiz.";
  if (!p.subject || p.subject.trim().length < 2) return "Konu geçersiz.";
  if (!p.body || p.body.trim().length < 5) return "Mesaj çok kısa.";
  return null;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get("SECRET_TURNSTILE_KEY");
  if (!secret) return true; // dev/test ortamı: secret yoksa atla
  if (!token || token === "disabled") return false;

  const params = new URLSearchParams({ secret, response: token });
  params.set("remoteip", ip);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return json({ success: false, error: "Sunucu yapılandırması eksik." }, 500);
  }

  let raw: any;
  try {
    raw = await req.json();
  } catch {
    return json({ success: false, error: "Geçersiz JSON" }, 400);
  }

  // Esnek alan eşlemesi (front-end hangi ismi kullanırsa kullansın).
  const payload = {
    sender_name: raw.sender_name ?? raw.name ?? "",
    sender_email: raw.sender_email ?? raw.email ?? "",
    sender_phone: raw.sender_phone ?? raw.phone ?? null,
    subject: raw.subject ?? "",
    body: raw.body ?? raw.message ?? "",
    token: raw.token ?? "",
  };

  const ip = clientIp(req);

  // 1) Turnstile doğrulaması (savunma katmanı).
  const ok = await verifyTurnstile(payload.token, ip);
  if (!ok) {
    return json({ success: false, error: "Turnstile doğrulaması başarısız." }, 403);
  }

  // 2) Alan doğrulaması.
  const err = validate(payload);
  if (err) {
    return json({ success: false, error: err }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRole);

  // 3) Rate-limit: aynı e-posta için son 10 dk içinde max N kayıt.
  const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count, error: countErr } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_email", payload.sender_email.trim().toLowerCase())
    .gte("created_at", since);

  if (countErr) {
    return json({ success: false, error: "Rate-limit sorgusu başarısız." }, 500);
  }
  if ((count ?? 0) >= RATE_LIMIT) {
    return json(
      { success: false, error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." },
      429,
    );
  }

  // 4) Kayıt.
  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_name: payload.sender_name.trim(),
      sender_email: payload.sender_email.trim().toLowerCase(),
      sender_phone: payload.sender_phone || null,
      subject: payload.subject.trim(),
      body: payload.body.trim(),
    })
    .select("id")
    .single();

  if (error) {
    return json({ success: false, error: "Kayıt başarısız." }, 500);
  }

  return json({ success: true, id: data.id }, 200);
});
