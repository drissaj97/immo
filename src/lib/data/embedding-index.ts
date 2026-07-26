import { buildCatalogNeighborhoods } from "@/lib/aggregation/catalog-analytics";
import { getStaticCatalogListings } from "@/lib/aggregation/catalog";
import { listingEmbeddingText } from "@/lib/aggregation/listing-embedding-text";
import { createEmbeddingProvider } from "@/modules/ai/embeddings-provider";
import {
  buildEmbeddingDocuments,
  searchByEmbedding,
  type EmbeddingDocument,
} from "@/modules/ai/embeddings";
import { getVectorSearchMode } from "@/server/repositories/embeddings-pgvector";

const provider = createEmbeddingProvider();
const MAX_LISTING_EMBEDDINGS = 300;
const MAX_NEIGHBORHOOD_EMBEDDINGS = 200;

let neighborhoodDocs: EmbeddingDocument[] | null = null;
let listingDocs: EmbeddingDocument[] | null = null;

function getNeighborhoodDocs(): EmbeddingDocument[] {
  if (!neighborhoodDocs) {
    neighborhoodDocs = buildEmbeddingDocuments(
      buildCatalogNeighborhoods().slice(0, MAX_NEIGHBORHOOD_EMBEDDINGS).map((k) => ({
        id: k.slug,
        text: `${k.city} ${k.neighborhood} ${k.summary} ${k.highlights.join(" ")} ${k.investmentNotes.join(" ")} ${k.tags.join(" ")}`,
        metadata: { city: k.city, neighborhood: k.neighborhood, type: "neighborhood" },
      })),
    );
  }
  return neighborhoodDocs;
}

function getListingDocs(): EmbeddingDocument[] {
  if (!listingDocs) {
    listingDocs = buildEmbeddingDocuments(
      getStaticCatalogListings()
        .slice(0, MAX_LISTING_EMBEDDINGS)
        .map((l) => ({
          id: l.id,
          text: listingEmbeddingText(l),
          metadata: { slug: l.slug, city: l.location.city, type: "listing" },
        })),
    );
  }
  return listingDocs;
}

export function searchNeighborhoodsByEmbedding(query: string, limit = 3) {
  return searchByEmbedding(query, getNeighborhoodDocs(), limit);
}

export function searchListingsByEmbedding(query: string, limit = 5) {
  return searchByEmbedding(query, getListingDocs(), limit);
}

export function getEmbeddingIndexStats() {
  const mode = getVectorSearchMode();
  const hoodDocs = getNeighborhoodDocs();
  const listDocs = getListingDocs();
  return {
    neighborhoods: hoodDocs.length,
    listings: listDocs.length,
    dimensions: hoodDocs[0]?.embedding.length ?? provider.dimensions,
    mode: mode === "pgvector" ? "openai-pgvector" : `${provider.name}-local`,
    provider: provider.name,
  };
}

export function getNeighborhoodCount(): number {
  return buildCatalogNeighborhoods().length;
}

export function getUniqueCityCount(): number {
  return new Set(getStaticCatalogListings().map((l) => l.location.city)).size;
}

export function resetEmbeddingIndexCache(): void {
  neighborhoodDocs = null;
  listingDocs = null;
}
