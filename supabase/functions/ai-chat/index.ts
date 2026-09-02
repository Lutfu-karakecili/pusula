import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const YKS_SYSTEM_PROMPT = `Sen PUSULA YKS Koçluk Platformu'nda çalışan bir AI asistanısın.
Görevin YKS öğrencilerine yardımcı olmak:
- YKS konularını açıkla (Sayısal, Sözel, Eşit Ağırlık)
- Matematik, Fizik, Kimya, Biyoloji, Türkçe, Tarih, Coğrafya, Felsefe konularında yardım et
- Çalışma planları öner
- Soru çözümü için ipuçları ver
- Motivasyon ve stres yönetimi konusunda destek ol
- TYT ve AYT konularını bil

Kurallar:
- Her zaman Türkçe konuş
- Kısa ve anlaşılır cevaplar ver
- Gerekirse adım adım açıkla
- Samimi ama profesyonel ol
- YKS odaklı kal, konu dışı sorulara kibarca yönlendir`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { messages } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiMessages = [
      { role: "system", content: YKS_SYSTEM_PROMPT },
      ...messages.slice(-20),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: apiMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ reply: "Bir hata oluştu." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Cevap alınamadı.";

    const lastUserMsg = messages[messages.length - 1]?.content || "";
    await supabase.from("ai_chats").insert([
      { user_id: user.id, role: "user", content: lastUserMsg },
      { user_id: user.id, role: "assistant", content: reply },
    ]);

    return new Response(JSON.stringify({ reply }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
