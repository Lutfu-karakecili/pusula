import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await request.json();

    const apiMessages = [
      { role: "system", content: YKS_SYSTEM_PROMPT },
      ...messages.slice(-20),
    ];

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply: "AI servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: apiMessages,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({
        reply: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
      });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Cevap alınamadı.";

    await supabase.from("ai_chats").insert([
      { user_id: user.id, role: "user", content: messages[messages.length - 1]?.content || "" },
      { user_id: user.id, role: "assistant", content: reply },
    ]);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
