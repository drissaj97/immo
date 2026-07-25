import { assistantResponseSchema, type AssistantResponse, type LLMMessage, type ToolContext } from "./types";
import { createLLMProvider, MockLLMProvider, OpenAILLMProvider } from "./llm-provider";
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
  const listings =
    (searchData?.data as { items?: Array<{ id: string; title: string; price: number; city: string; slug: string }> })
      ?.items ?? [];

  const messages: LLMMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-6),
    { role: "user", content: userMessage },
  ];

  let response: AssistantResponse;

  if (provider instanceof OpenAILLMProvider) {
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
        source: "DarBladi catalogue démo",
        type: "fact" as const,
        label: `${listings.length} bien(s) correspondant(s)`,
      },
    ],
    mode: provider.name,
    toolResults,
  };
}
