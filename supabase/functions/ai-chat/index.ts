// Supabase Edge Function: ai-chat
// Deploy: supabase functions deploy ai-chat
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Bu fonksiyon, öğrencinin AI Sohbet ekranından gelen mesajı alır, YKS'ye
// özel bir sistem prompt'uyla birlikte modele iletir ve yanıtı
// Server-Sent Events (SSE) formatında GERÇEK ZAMANLI olarak stream eder.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Sen Pusula platformunun YKS (Yükseköğretim Kurumları Sınavı) çalışma
asistanısın. Sadece YKS (TYT/AYT) hazırlığıyla ilgili konularda yardımcı ol:
konu anlatımı, soru çözüm stratejisi, çalışma programı önerileri, motivasyon.
LGS, PDR (psikolojik danışmanlık/klinik tavsiye) veya sınavla ilgisi olmayan
konularda yardım isteniyorsa, kibarca YKS odaklı olduğunu belirt ve konuyu
YKS'ye yönlendir. Kısa, net, öğrenciyi yönlendirici ve pozitif bir dil kullan.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Yetkisiz." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversation_id, message } = await req.json();
    if (!conversation_id || !message) {
      return new Response(JSON.stringify({ error: "conversation_id ve message zorunludur." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Kullanıcı mesajını kaydet
    await supabase.from("ai_messages").insert({ conversation_id, role: "user", content: message });

    // Sohbet geçmişini çek (son 20 mesaj)
    const { data: history } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(20);

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        stream: true,
        messages: (history ?? []).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
      }),
    });

    if (!anthropicRes.body) throw new Error("Model yanıtı alınamadı.");

    let fullText = "";
    const stream = new ReadableStream({
      async start(controller) {
        const reader = anthropicRes.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);

          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === "content_block_delta" && evt.delta?.text) {
                fullText += evt.delta.text;
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: evt.delta.text })}\n\n`));
              }
            } catch {
              /* satır parse edilemedi, yoksay */
            }
          }
        }

        // Tam yanıtı asistan mesajı olarak kaydet
        await supabase.from("ai_messages").insert({ conversation_id, role: "assistant", content: fullText });
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
