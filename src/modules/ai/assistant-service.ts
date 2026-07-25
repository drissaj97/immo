import { assistantResponseSchema, type AssistantResponse, type LLMMessage, type ToolContext } from "./types";
import { createLLMProvider, MockLLMProvider, OpenAILLMProvider, ResilientLLMProvider } from "./llm-provider";
import { executeFromNaturalLanguage } from "./tools";

const SYSTEM_PROMPT = `Tu es DarBladi, l'assistant immobilier pour le Maroc.
Règles strictes :
- Ne jamais inventer prix, surface, équipements ou statut juridique.
- Distinguer faits, calculs, estimations, hypothèses et recommandations.
- Indiquer la source de chaque information.
- Ne pas donner d'avis juridique ou garantir un rendement.
- Les données peuvent être fictives (démo) — le préciser.
- Répondre en français sauf demande contraire.`;

export async function runAssistant(
  userMessage: string,
  ctx: ToolContext,
  history: LLMMessage[] = [],
): Promise<AssistantResponse & { mode: string; toolResults: unknown[] }> {
  const provider = createLLMProvider();
  const { parsed, toolResults } = await executeFromNaturalLanguage(userMessage, ctx);

  const searchData = toolResults.find((t) => t.tool === "searchListings");
  const ragData = toolResults.find((t) => t.tool === "getNeighborhoodContext");
  const listings =
    (searchData?.data as { items?: Array<{ id: string; title: string; price: number; city: string; slug: string }> })
      ?.items ?? [];

  const messages: LLMMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-6),
    { role: "user", content: userMessage },
  ];

  let response: AssistantResponse;
  let mode = provider.name;

  if (provider instanceof ResilientLLMProvider) {
    try {
      response = await provider.structured(assistantResponseSchema, messages);
      mode = provider.activeMode === "mock-fallback" ? "mock-fallback" : "openai";
      if (provider.fallbackReasonText) {
        response.assumptions = [
          ...(response.assumptions ?? []),
          provider.fallbackReasonText,
        ];
      }
    } catch {
      response = await new MockLLMProvider().structured(assistantResponseSchema, messages);
      mode = "mock";
    }
  } else if (provider instanceof OpenAILLMProvider) {
    try {
      response = await provider.structured(assistantResponseSchema, messages);
    } catch {
      response = await new MockLLMProvider().structured(assistantResponseSchema, messages);
    }
  } else {
    response = await new MockLLMProvider().structured(assistantResponseSchema, messages);
  }

  return {
    ...response,
    filters: response.filters ?? parsed.filters,
    assumptions: response.assumptions ?? parsed.assumptions,
    missing: response.missing ?? parsed.missing,
    listings: listings.length ? listings : response.listings,
    citations: [
      ...(response.citations ?? []),
      {
        source: "DarBladi catalogue",
        type: "fact" as const,
        label: `${listings.length} bien(s) correspondant(s)`,
      },
      ...(ragData?.data && typeof ragData.data === "object" && "neighborhood" in (ragData.data as object)
        ? [{
            source: "DarBladi — RAG quartiers",
            type: "fact" as const,
            label: `Contexte ${(ragData.data as { neighborhood: string; city: string }).neighborhood}, ${(ragData.data as { city: string }).city}`,
          }]
        : []),
    ],
    mode: provider instanceof ResilientLLMProvider && provider.activeMode === "mock-fallback"
      ? "mock-fallback"
      : mode,
    toolResults,
  };
}
