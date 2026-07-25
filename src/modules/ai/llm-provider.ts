import { z } from "zod";
import type { LLMMessage, LLMOptions, LLMProvider } from "./types";
import { OpenAIQuotaError, openaiFetch, shouldFallbackOnQuota } from "./openai-fetch";
import { parseNaturalLanguageQuery } from "@/modules/search/natural-language-parser";

/** Parseur local — fallback sans clé API */
export class MockLLMProvider implements LLMProvider {
  readonly name = "mock";
  readonly fallbackReason?: string;

  constructor(fallbackReason?: string) {
    this.fallbackReason = fallbackReason;
  }

  async complete(messages: LLMMessage[], _options?: LLMOptions): Promise<string> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return "Comment puis-je vous aider dans votre projet immobilier ?";

    const parsed = parseNaturalLanguageQuery(lastUser.content);
    const filtersDesc = Object.entries(parsed.filters)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");

    let reply = this.fallbackReason
      ? `[Mode local — ${this.fallbackReason}] `
      : "";
    reply += `J'ai analysé votre demande. Critères identifiés : ${filtersDesc || "recherche générale"}.`;
    if (parsed.assumptions.length) {
      reply += ` Hypothèses : ${parsed.assumptions.join(" ; ")}.`;
    }
    if (parsed.missing.length) {
      reply += ` Pour affiner : ${parsed.missing.join(", ")}.`;
    }
    reply += " Consultez les résultats proposés ci-dessous.";
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
        {
          source: this.fallbackReason ? "DarBladi parseur local (fallback quota OpenAI)" : "DarBladi parseur local",
          type: "fact" as const,
          label: "Critères extraits de votre message",
        },
      ],
    };
    return schema.parse(draft);
  }
}

export class OpenAILLMProvider implements LLMProvider {
  readonly name = "openai";

  constructor(private apiKey: string, private model = process.env.AI_MODEL ?? "gpt-4o-mini") {}

  async complete(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const res = await openaiFetch("https://api.openai.com/v1/chat/completions", {
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
      const err = await res.text();
      throw new Error(`OpenAI error: ${res.status} — ${err.slice(0, 200)}`);
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

/** Wraps OpenAI with automatic mock fallback on quota exhaustion */
export class ResilientLLMProvider implements LLMProvider {
  readonly name = "openai";
  private fallbackReason: string | null = null;

  constructor(private primary: OpenAILLMProvider) {}

  get activeMode(): string {
    return this.fallbackReason ? "mock-fallback" : "openai";
  }

  get fallbackReasonText(): string | null {
    return this.fallbackReason;
  }

  private mock() {
    return new MockLLMProvider(this.fallbackReason ?? undefined);
  }

  async complete(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    if (this.fallbackReason) return this.mock().complete(messages, options);
    try {
      return await this.primary.complete(messages, options);
    } catch (err) {
      if (shouldFallbackOnQuota() && err instanceof OpenAIQuotaError) {
        this.fallbackReason = "quota OpenAI épuisé — rechargez votre compte sur platform.openai.com";
        console.warn("[ai:llm] Quota exceeded — falling back to local parser");
        return this.mock().complete(messages, options);
      }
      throw err;
    }
  }

  async structured<T>(schema: z.ZodType<T>, messages: LLMMessage[]): Promise<T> {
    if (this.fallbackReason) return this.mock().structured(schema, messages);
    try {
      return await this.primary.structured(schema, messages);
    } catch (err) {
      if (shouldFallbackOnQuota() && err instanceof OpenAIQuotaError) {
        this.fallbackReason = "quota OpenAI épuisé — rechargez votre compte sur platform.openai.com";
        console.warn("[ai:llm] Quota exceeded — falling back to local parser");
        return this.mock().structured(schema, messages);
      }
      throw err;
    }
  }
}

export function createLLMProvider(): LLMProvider {
  const provider = process.env.AI_PROVIDER ?? "mock";
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return new ResilientLLMProvider(new OpenAILLMProvider(process.env.OPENAI_API_KEY));
  }
  return new MockLLMProvider();
}

export async function checkOpenAIHealth(): Promise<{
  configured: boolean;
  status: "ok" | "quota_exceeded" | "error" | "not_configured";
  message: string;
}> {
  if (process.env.AI_PROVIDER !== "openai" || !process.env.OPENAI_API_KEY) {
    return { configured: false, status: "not_configured", message: "AI_PROVIDER=mock" };
  }
  try {
    const res = await openaiFetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4o-mini",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
    });
    if (res.ok) return { configured: true, status: "ok", message: "OpenAI opérationnel" };
    const body = await res.text();
    return { configured: true, status: "error", message: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err) {
    if (err instanceof OpenAIQuotaError) {
      return {
        configured: true,
        status: "quota_exceeded",
        message: "Quota OpenAI épuisé — ajoutez un moyen de paiement sur platform.openai.com/settings/organization/billing",
      };
    }
    return { configured: true, status: "error", message: String(err) };
  }
}
