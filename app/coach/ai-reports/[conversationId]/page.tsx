import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReviewNoteForm } from "./review-note-form";

export default async function AIConversationDetailPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const coach = await getCurrentProfile();
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("*, student:students(profile:profiles(full_name))")
    .eq("id", conversationId)
    .single();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Sohbet Detayı</h1>
        <p className="text-sm text-muted-foreground">
          {(conversation as any).student?.profile?.full_name} — {conversation.title || "AI Sohbet"}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {(messages ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Bu sohbette mesaj yok.</p>
          ) : (
            (messages ?? []).map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Koç Değerlendirmesi</CardTitle>
          <CardDescription>
            Öğrencinin AI ile konuştuğu konular hakkında kendi analizini buraya not alabilirsin.
            Bu not sadece senin tarafında görünür.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReviewNoteForm conversationId={conversationId} coachId={coach.id} reviewed={!!(conversation as any).reviewed_by_coach} />
        </CardContent>
      </Card>
    </div>
  );
}
