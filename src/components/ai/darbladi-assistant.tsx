"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { LLMMessage } from "@/modules/ai/types";

type ChatMessage = LLMMessage & {
  citations?: Array<{ source: string; type: string; label: string }>;
  listings?: Array<{ id: string; title: string; price: number; city: string; slug: string }>;
  filters?: Record<string, unknown>;
  mode?: string;
};

export function DarBladiAssistant({ locale }: { locale: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Bonjour, je suis DarBladi, votre assistant immobilier. Décrivez votre projet : achat, location, investissement locatif… Je m'appuie sur le catalogue agrégé DarBladi.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.filter((m) => m.role === "user" || m.role === "assistant");
      const res = await fetch(`/${locale}/api/darbladi/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, history }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply ?? "Je n'ai pas pu traiter votre demande.",
          citations: data.citations,
          listings: data.listings,
          filters: data.filters,
          mode: data.mode,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function applySearch(filters?: Record<string, unknown>) {
    if (!filters) return;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.set(k, String(v));
    });
    router.push(`/${locale}/biens?${params.toString()}`);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px] rounded-xl border border-charcoal/10 bg-ivory overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-deep-green text-ivory">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                msg.role === "user" ? "bg-deep-green text-ivory" : "bg-sand/60 text-charcoal"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.citations && msg.citations.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs opacity-80">
                  {msg.citations.map((c, j) => (
                    <li key={j}>
                      [{c.type}] {c.label} — {c.source}
                    </li>
                  ))}
                </ul>
              )}

              {msg.listings && msg.listings.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {msg.listings.map((l) => (
                    <li key={l.id}>
                      <Link
                        href={`/${locale}/biens/${l.slug}`}
                        className="block rounded border border-charcoal/10 bg-ivory px-3 py-2 hover:border-deep-green/30"
                      >
                        <span className="font-medium">{l.title}</span>
                        <span className="block text-xs text-charcoal/60">
                          {l.price.toLocaleString("fr-MA")} MAD · {l.city}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {msg.filters && Object.keys(msg.filters).length > 0 && msg.role === "assistant" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => applySearch(msg.filters)}
                >
                  Voir tous les résultats
                </Button>
              )}

              {msg.mode && msg.role === "assistant" && (
                <Badge variant="demo" className="mt-2">
                  {msg.mode === "openai" ? "OpenAI" : "Mode démo DarBladi"}
                </Badge>
              )}
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal/10">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-charcoal/50 animate-pulse">DarBladi analyse votre demande…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-charcoal/10 p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex : F3 à Salé proche Technopolis pour moins de 1 300 000 DH"
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <Button onClick={send} disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
