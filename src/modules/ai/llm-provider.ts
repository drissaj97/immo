import { z } from "zod";
import type { LLMMessage, LLMOptions, LLMProvider } from "./types";
import { parseNaturalLanguageQuery } from "@/modules/search/natural-language-parser";

/** Parseur local — fallback sans clé API */
export class MockLLMProvider implements LLMProvider {
  readonly name = "mock";

  async complete(messages: LLMMessage[], _options?: LLMOptions): Promise<string> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return "Comment puis-je vous aider dans votre projet immobilier ?";

    const parsed = parseNaturalLanguageQuery(lastUser.content);
    const filtersDesc = Object.entries(parsed.filters)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    let reply = `J'ai analysé votre demande. Critères identifiés : ${filtersDesc || "recherche générale"}.`;
    if (parsed.assumptions.length) {
      reply += ` Hypothèses : ${parsed.assumptions.join(" ; ")}.`;
    }
    if (parsed.missing.length) {
      reply += ` Pour affiner : ${parsed.missing.join(", ")}.`;
    }
    reply += " Consultez les résultats proposés ci-dessous (données de démonstration).";
    return reply;
  }

  async structured<T>(schema: z.ZodType<T>, messages: LLMMessage[]): Promise<T> {
    const text = await this.complete(messages);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const parsed = lastUser ? parseNaturalLanguageQuery(lastUser.content) : { filters: {}, assumptions: [], missing: [] };

    const draft = {
      reply: text,
      intent: "search" as const,
      filters: parsed.filters,
      assumptions: parsed.assumptions,
      missing: parsed.missing,
      citations: [
        { source: "DarBladi parseur local", type: "fact" as const, label: "Critères extraits de votre message" },
      ],
    };
    return schema.parse(draft);
  }
}

export class OpenAILLMProvider implements LLMProvider {
  readonly name = "openai";

  constructor(private apiKey: string, private model = process.env.AI_MODEL ?? "gpt-4o-mini") {}

  async complete(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: options?.temperature ?? 0.2,
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenAI error: ${res.status}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? "";
  }

  async structured<T>(schema: z.ZodType<T>, messages: LLMMessage[]): Promise<T> {
    const systemAdd: LLMMessage = {
      role: "system",
      content:
        "Réponds UNIQUEMENT en JSON valide correspondant au schéma demandé. Ne invente jamais de caractéristiques de biens (piscine, surface, prix). Distingue facts, calculations, estimates, hypotheses, recommendations dans citations.type.",
    };
    const text = await this.complete([systemAdd, ...messages], { maxTokens: 1500, temperature: 0.1 });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in LLM response");
    return schema.parse(JSON.parse(jsonMatch[0]));
  }
}

export function createLLMProvider(): LLMProvider & { structured?: <T>(schema: z.ZodType<T>, messages: LLMMessage[]) => Promise<T> } {
  const provider = process.env.AI_PROVIDER ?? "mock";
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAILLMProvider(process.env.OPENAI_API_KEY);
  }
  return new MockLLMProvider();
}
