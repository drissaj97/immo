import { DEMO_LISTINGS } from "@/lib/data/demo-data";
import { HOLDING_LISTINGS } from "@/lib/data/holding-listings";
import { NEIGHBORHOOD_KNOWLEDGE } from "@/lib/data/neighborhood-knowledge";
import { createEmbeddingProvider } from "@/modules/ai/embeddings-provider";
import { buildEmbeddingDocuments, searchByEmbedding } from "@/modules/ai/embeddings";
import { getVectorSearchMode } from "@/server/repositories/embeddings-pgvector";

const provider = createEmbeddingProvider();

const catalogForEmbeddings = [
  ...HOLDING_LISTINGS,
  ...DEMO_LISTINGS.filter((l) => l.status === "published" && !l.id.startsWith("hi-")),
];

const neighborhoodDocs = buildEmbeddingDocuments(
  NEIGHBORHOOD_KNOWLEDGE.map((k) => ({
    id: k.slug,
    text: `${k.city} ${k.neighborhood} ${k.summary} ${k.highlights.join(" ")} ${k.investmentNotes.join(" ")} ${k.tags.join(" ")}`,
    metadata: { city: k.city, neighborhood: k.neighborhood, type: "neighborhood" },
  })),
);

const listingDocs = buildEmbeddingDocuments(
  catalogForEmbeddings.map((l) => ({
    id: l.id,
    text: `${l.title} ${l.description} ${l.location.city} ${l.location.neighborhood} ${l.listingType} ${l.transactionType}`,
    metadata: { slug: l.slug, city: l.location.city, type: "listing" },
  })),
);

export function searchNeighborhoodsByEmbedding(query: string, limit = 3) {
  return searchByEmbedding(query, neighborhoodDocs, limit);
}

export function searchListingsByEmbedding(query: string, limit = 5) {
  return searchByEmbedding(query, listingDocs, limit);
}

export function getEmbeddingIndexStats() {
  const mode = getVectorSearchMode();
  return {
    neighborhoods: neighborhoodDocs.length,
    listings: listingDocs.length,
    dimensions: neighborhoodDocs[0]?.embedding.length ?? provider.dimensions,
    mode: mode === "pgvector" ? "openai-pgvector" : `${provider.name}-local`,
    provider: provider.name,
  };
}

export function getNeighborhoodCount(): number {
  return NEIGHBORHOOD_KNOWLEDGE.length;
}

export function getUniqueCityCount(): number {
  return new Set(NEIGHBORHOOD_KNOWLEDGE.map((n) => n.city)).size;
}
