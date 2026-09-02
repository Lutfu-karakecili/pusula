import { getCurrentStudent } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { ChatClient } from "./chat-client";

export default async function StudentAiPage() {
  const student = await getCurrentStudent();
  const supabase = await createClient();

  const { data: lastConversation } = await supabase
    .from("ai_conversations")
    .select("*, ai_messages(*)")
    .eq("student_id", student.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col md:h-[calc(100vh-6rem)]">
      <ChatClient
        conversationId={lastConversation?.id ?? null}
        initialMessages={(lastConversation as any)?.ai_messages ?? []}
        studentName={student.profile.full_name}
      />
    </div>
  );
}
