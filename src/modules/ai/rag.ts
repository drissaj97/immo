import {
  NEIGHBORHOOD_KNOWLEDGE,
  enrichWithMetrics,
  getNeighborhoodBySlug,
  type NeighborhoodKnowledge,
} from "@/lib/data/neighborhood-knowledge";
import { buildCatalogNeighborhoods } from "@/lib/aggregation/catalog-analytics";
import { searchNeighborhoodsByEmbedding } from "@/lib/data/embedding-index";

export type RagMatch = {
  knowledge: NeighborhoodKnowledge;
  score: number;
  matchedTerms: string[];
};

function allNeighborhoods(): NeighborhoodKnowledge[] {
  const catalog = buildCatalogNeighborhoods();
  const catalogSlugs = new Set(catalog.map((n) => n.slug));
  const editorial = NEIGHBORHOOD_KNOWLEDGE.filter((n) => !catalogSlugs.has(n.slug)).map(
    enrichWithMetrics,
  );
  return [...catalog, ...editorial];
}

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
    if (knowledge.neighborhood.toLowerCase().includes(term)) score += 6;
    if (corpus.includes(term)) {
      score += 2;
      matchedTerms.push(term);
    }
  }

  const qLower = query.toLowerCase();
  const qNorm = qLower.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const hoodNorm = knowledge.neighborhood
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (qNorm.includes(hoodNorm)) score += 30;
  if (qNorm.includes(knowledge.city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) score += 8;

  return { knowledge: enrichWithMetrics(knowledge), score, matchedTerms };
}

export function searchNeighborhoodKnowledge(query: string, limit = 3): RagMatch[] {
  if (!query.trim()) return [];

  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const neighborhoods = allNeighborhoods();
  const keywordResults = neighborhoods.map((k) => scoreMatch(query, k)).filter((m) => m.score > 0);

  const embeddingResults = searchNeighborhoodsByEmbedding(query, limit);
  const maxEmbScore = embeddingResults[0]?.score ?? 0;
  if (keywordResults.length === 0 && maxEmbScore < 0.25) {
    return [];
  }

  const merged = new Map<string, RagMatch>();

  for (const m of keywordResults) {
    merged.set(m.knowledge.slug, m);
  }

  for (const e of embeddingResults) {
    const k = neighborhoods.find((n) => n.slug === e.id);
    if (!k || e.score < 0.15) continue;
    const existing = merged.get(k.slug);
    const embScore = Math.round(e.score * 50);
    if (existing) {
      existing.score += embScore * 0.3;
    } else if (embScore >= 12) {
      merged.set(k.slug, {
        knowledge: enrichWithMetrics(k),
        score: embScore,
        matchedTerms: ["embedding"],
      });
    }
  }

  return Array.from(merged.values())
    .filter((m) => m.score >= 8)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getNeighborhoodContext(
  city?: string,
  neighborhood?: string,
): NeighborhoodKnowledge | null {
  if (!city && !neighborhood) return null;

  const neighborhoods = allNeighborhoods();
  const match = neighborhoods.find((k) => {
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
    knowledge.avgPricePerSqm
      ? `Prix moyen indicatif: ${knowledge.avgPricePerSqm} MAD/m² (catalogue agrégé)`
      : "",
    knowledge.avgYield ? `Rendement moyen indicatif: ${knowledge.avgYield}%` : "",
    `Source: DarBladi — ${knowledge.listingCount ?? "plusieurs"} annonces indexées`,
  ]
    .filter(Boolean)
    .join("\n");
}
