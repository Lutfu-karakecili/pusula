"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Profile, AiChat } from "@/lib/types";
import { Send, Bot, User, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "TYT matematik için study planı öner",
  "Fizik optik konusunu açıkla",
  "Sınava nasıl hazırlanmalıyım?",
  "Stres yönetimi için ne yapabilirim?",
  "AYT kimya organik kimya konu özeti",
];

export default function StudentAIPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<AiChat[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      const { data: chats } = await supabase
        .from("ai_chats")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setMessages(chats || []);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || sending) return;

    const userMsg: AiChat = {
      id: crypto.randomUUID(),
      user_id: profile?.id || "",
      role: "user",
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      const assistantMsg: AiChat = {
        id: crypto.randomUUID(),
        user_id: profile?.id || "",
        role: "assistant",
        content: data.reply || "Cevap alınamadı.",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: AiChat = {
        id: crypto.randomUUID(),
        user_id: profile?.id || "",
        role: "assistant",
        content: "Bir hata oluştu. Lütfen tekrar deneyin.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );

  return (
    <DashboardLayout role="student" userName={profile?.full_name || "Öğrenci"}>
      <div className="flex flex-col h-[calc(100vh-3rem)]">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-purple-400" />
            AI Asistan
          </h1>
          <p className="text-muted-foreground">
            YKS hazırlığında sorularını yanıtlayalım
          </p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Merhaba! Ben PUSULA AI Asistan
              </h3>
              <p className="text-muted-foreground max-w-md text-sm">
                YKS hazırlığında sana yardımcı olabilirim. Matematik, fizik,
                kimya ve daha birçok konuda sorularını yanıtlayabilirim.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => sendMessage(s)}
                    className="text-xs"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-purple-400" />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/50 rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-purple-400" />
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Sorunu yaz... (Enter ile gönder, Shift+Enter ile yeni satır)"
              className="min-h-[48px] max-h-[120px] resize-none"
              disabled={sending}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shrink-0"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            AI asistan hatalı bilgi verebilir. Önemli kararlar için koçuna danış.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
