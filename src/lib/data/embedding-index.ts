import { DEMO_LISTINGS } from "@/lib/data/demo-data";
import { NEIGHBORHOOD_KNOWLEDGE } from "@/lib/data/neighborhood-knowledge";
import { buildEmbeddingDocuments, searchByEmbedding } from "@/modules/ai/embeddings";

const neighborhoodDocs = buildEmbeddingDocuments(
  NEIGHBORHOOD_KNOWLEDGE.map((k) => ({
    id: k.slug,
    text: `${k.city} ${k.neighborhood} ${k.summary} ${k.highlights.join(" ")} ${k.investmentNotes.join(" ")} ${k.tags.join(" ")}`,
    metadata: { city: k.city, neighborhood: k.neighborhood, type: "neighborhood" },
  })),
);

const listingDocs = buildEmbeddingDocuments(
  DEMO_LISTINGS.filter((l) => l.status === "published").map((l) => ({
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
  return {
    neighborhoods: neighborhoodDocs.length,
    listings: listingDocs.length,
    dimensions: neighborhoodDocs[0]?.embedding.length ?? 0,
    mode: "mock-pgvector",
  };
}
