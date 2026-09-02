import { createClient } from "@/lib/supabase/server";

// POST /api/ai/chat
// Body: { conversation_id?: string, message: string }
// - conversation_id verilmezse öğrenci için yeni bir sohbet açar.
// - Supabase Edge Function'a (ai-chat) kullanıcının oturum token'ıyla
//   proxy yapar ve SSE stream'i olduğu gibi istemciye iletir (gerçek zamanlı).
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user, session },
  } = await supabase.auth.getSession().then((r) => ({ data: { user: r.data.session?.user ?? null, session: r.data.session } }));

  if (!user || !session) {
    return Response.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await req.json();
  let conversationId = body.conversation_id as string | undefined;
  const message = body.message as string;

  if (!message?.trim()) {
    return Response.json({ error: "Mesaj boş olamaz." }, { status: 400 });
  }

  if (!conversationId) {
    const { data: conv, error } = await supabase
      .from("ai_conversations")
      .insert({ student_id: user.id, title: message.slice(0, 40) })
      .select()
      .single();
    if (error) return Response.json({ error: error.message }, { status: 400 });
    conversationId = conv.id;
  }

  const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat`;
  const edgeRes = await fetch(edgeUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });

  if (!edgeRes.ok || !edgeRes.body) {
    return Response.json({ error: "AI servisine ulaşılamadı." }, { status: 502 });
  }

  // Edge Function'ın SSE stream'ini doğrudan istemciye geçir (gerçek zamanlı).
  return new Response(edgeRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Conversation-Id": conversationId!,
    },
  });
}
