"use client";

import { useRef, useState, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

const SUGGESTIONS = [
  "Bu hafta türev konusunda nelere odaklanmalıyım?",
  "TYT matematik netimi nasıl artırabilirim?",
  "Sınava 3 ay kala haftalık program nasıl olmalı?",
];

export function ChatClient({
  conversationId: initialConversationId,
  initialMessages,
  studentName,
}: {
  conversationId: string | null;
  initialMessages: ChatMessage[];
  studentName: string;
}) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setInput("");

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, message: text }),
    });

    const newConvId = res.headers.get("X-Conversation-Id");
    if (newConvId) setConversationId(newConvId);

    if (!res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.replace(/^data: /, "").trim();
        if (!line) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.text) {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + evt.text } : m))
            );
          }
        } catch {
          /* ignore */
        }
      }
    }

    setLoading(false);
  }

  return (
    <Card className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border bg-gradient-card p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-pusula text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold">Pusula AI Asistan</p>
          <p className="text-xs text-muted-foreground">Sadece YKS (TYT/AYT) odaklı çalışma asistanın</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="space-y-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">Merhaba {studentName.split(" ")[0]}, YKS ile ilgili ne sormak istersin?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex items-end gap-2", m.role === "user" && "flex-row-reverse")}>
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className={m.role === "assistant" ? "bg-gradient-pusula" : ""}>
                {m.role === "assistant" ? <Sparkles className="h-3.5 w-3.5" /> : initials(studentName)}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user" ? "bg-gradient-pusula text-white" : "bg-muted"
              )}
            >
              {m.content || (loading && m.role === "assistant" ? <Loader2 className="h-4 w-4 animate-spin" /> : "")}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          placeholder="YKS ile ilgili bir soru sor..."
          className="min-h-[44px] flex-1 resize-none"
          rows={1}
        />
        <Button type="submit" variant="gradient" size="icon" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </Card>
  );
}
