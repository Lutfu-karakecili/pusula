// supabase/functions/contact/index.ts
//
// Cloudflare Turnstile "siteverify" (sunucu tarafı) + iletişim formu için
// rate-limit ve mesaj kaydı yapan Supabase Edge Function.
//
// Dağıtım:
//   supabase functions deploy contact
//
// Gerekli secrets (Supabase Dashboard > Edge Functions > Secrets):
//   TURNSTILE_SECRET_KEY       -> Cloudflare Turnstile secret key
//   SUPABASE_URL               -> Proje URL'si
//   SUPABASE_SERVICE_ROLE_KEY  -> service_role key (RLS'i bypass eder, yalnızca sunucu)
//
// İstemci tarafı:: src/lib/server-verify.js üzerinden çağrılır.
//   { action: 'verify',  token }          -> { success: boolean }
//   { action: 'submit',  payload }         -> { success, id? } | hata

import { createClient } from "jsr:@supabase/supabase-js@2";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const RATE_LIMIT = 5; // izin verilen istek sayısı
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 dakika pencere

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ContactPayload {
  token?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  // Secret tanımsızsa (ör. yerel dev) doğrulamayı atla
  if (!secret) return true;
  if (!token || token === "disabled") return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const data = await res.json();
  return !!data.success;
}

async function rateLimited(ip: string): Promise<boolean> {
  let kv: Deno.Kv;
  try {
    kv = await Deno.openKv();
  } catch {
    // KV kullanılamıyorsa rate-limit uygulama (öncelik: Turnstile doğrulaması)
    return false;
  }
  const key = ["contact_rate", ip];
  const now = Date.now();
  const res = await kv.get<number[]>(key);
  const hits = (res.value || []).filter((t) => now - t < RATE_WINDOW_MS);

  if (hits.length >= RATE_LIMIT) {
    await kv.set(key, hits, { expireIn: RATE_WINDOW_MS });
    return true;
  }
  hits.push(now);
  await kv.set(key, hits, { expireIn: RATE_WINDOW_MS });
  return false;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || "unknown";
}

function validate(p: ContactPayload): string | null {
  if (!p.name || p.name.trim().length < 2) return "Ad alanı geçersiz.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email || ""))
    return "E-posta geçersiz.";
  if (!p.subject || p.subject.trim().length < 2) return "Konu geçersiz.";
  if (!p.message || p.message.trim().length < 5) return "Mesaj çok kısa.";
  return null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

async function handleSubmit(p: ContactPayload, ip: string): Promise<Response> {
  if (await rateLimited(ip)) {
    return json(
      { success: false, error: "Çok fazla istek. Lütfen daha sonra tekrar deneyin." },
      429,
    );
  }

  const ok = await verifyTurnstile(p.token || "", ip);
  if (!ok) {
    return json({ success: false, error: "Turnstile doğrulaması başarısız." }, 403);
  }

  const err = validate(p);
  if (err) return json({ success: false, error: err }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_name: p.name.trim(),
      sender_email: p.email.trim(),
      sender_phone: p.phone || null,
      subject: p.subject.trim(),
      body: p.message.trim(),
    })
    .select("id")
    .single();

  if (error) return json({ success: false, error: "Kayıt başarısız." }, 500);

  return json({ success: true, id: data.id }, 200);
}

async function handleVerify(token: string, ip: string): Promise<Response> {
  const ok = await verifyTurnstile(token, ip);
  return json({ success: ok }, 200);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Geçersiz JSON" }, 400);
  }

  const ip = clientIp(req);
  const action = body?.action;

  if (action === "verify") return handleVerify(body?.token || "", ip);
  if (action === "submit") return handleSubmit(body?.payload || body, ip);

  return json({ success: false, error: "Bilinmeyen action" }, 400);
});
