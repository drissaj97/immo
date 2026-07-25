import {
  NEIGHBORHOOD_KNOWLEDGE,
  enrichWithMetrics,
  getNeighborhoodBySlug,
  type NeighborhoodKnowledge,
} from "@/lib/data/neighborhood-knowledge";

export type RagMatch = {
  knowledge: NeighborhoodKnowledge;
  score: number;
  matchedTerms: string[];
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[\s,.-]+/)
    .filter((t) => t.length > 2);
}

function scoreMatch(query: string, knowledge: NeighborhoodKnowledge): RagMatch {
  const terms = tokenize(query);
  const corpus = [
    knowledge.city,
    knowledge.neighborhood,
    knowledge.summary,
    ...knowledge.highlights,
    ...knowledge.investmentNotes,
    ...knowledge.tags,
  ]
    .join(" ")
    .toLowerCase();

  const matchedTerms: string[] = [];
  let score = 0;

  for (const term of terms) {
    if (knowledge.city.toLowerCase().includes(term)) score += 3;
    if (knowledge.neighborhood.toLowerCase().includes(term)) score += 4;
    if (corpus.includes(term)) {
      score += 2;
      matchedTerms.push(term);
    }
  }

  // Direct slug/city+neighborhood match boost
  const slugHint = `${knowledge.city}/${knowledge.neighborhood}`.toLowerCase();
  if (query.toLowerCase().includes(knowledge.neighborhood.toLowerCase())) score += 5;
  if (query.toLowerCase().includes(knowledge.city.toLowerCase())) score += 3;
  if (query.toLowerCase().includes(slugHint.replace(/\s+/g, ""))) score += 6;

  return { knowledge: enrichWithMetrics(knowledge), score, matchedTerms };
}

/**
 * Mock RAG search — keyword scoring over neighborhood knowledge base.
 * Replace with pgvector embeddings when DATABASE_URL + pgvector configured.
 */
export function searchNeighborhoodKnowledge(query: string, limit = 3): RagMatch[] {
  if (!query.trim()) return [];

  return NEIGHBORHOOD_KNOWLEDGE.map((k) => scoreMatch(query, k))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getNeighborhoodContext(
  city?: string,
  neighborhood?: string,
): NeighborhoodKnowledge | null {
  if (!city && !neighborhood) return null;

  const match = NEIGHBORHOOD_KNOWLEDGE.find((k) => {
    const cityOk = !city || k.city.toLowerCase() === city.toLowerCase();
    const hoodOk =
      !neighborhood ||
      k.neighborhood.toLowerCase() === neighborhood.toLowerCase() ||
      k.slug.endsWith(neighborhood.toLowerCase().replace(/\s+/g, "-"));
    return cityOk && hoodOk;
  });

  return match ? enrichWithMetrics(match) : null;
}

export function getNeighborhoodContextBySlug(slug: string): NeighborhoodKnowledge | null {
  const k = getNeighborhoodBySlug(slug);
  return k ? enrichWithMetrics(k) : null;
}

export function formatKnowledgeForLLM(knowledge: NeighborhoodKnowledge): string {
  return [
    `Quartier: ${knowledge.neighborhood}, ${knowledge.city} (${knowledge.region})`,
    `Résumé: ${knowledge.summary}`,
    `Points clés: ${knowledge.highlights.join("; ")}`,
    `Notes investissement: ${knowledge.investmentNotes.join("; ")}`,
    knowledge.avgPricePerSqm ? `Prix moyen indicatif: ${knowledge.avgPricePerSqm} MAD/m² (démo)` : "",
    knowledge.avgYield ? `Rendement moyen indicatif: ${knowledge.avgYield}% (démo)` : "",
    "Source: DarBladi — base connaissance quartiers (données fictives)",
  ]
    .filter(Boolean)
    .join("\n");
}
