import type { DemoListing } from "@/lib/data/demo-data";
import { HOLDING_LISTINGS } from "@/lib/data/holding-listings";
import { listingEmbeddingText } from "@/lib/aggregation/listing-embedding-text";
import { SEMSARAI_LISTINGS } from "@/lib/data/semsarai-listings";

export { listingEmbeddingText };

let cachedListings: DemoListing[] | null = null;

/** Annonces réelles embarquées (Holding IMMO + SEMSAR AI importées). */
export function getStaticCatalogListings(): DemoListing[] {
  if (!cachedListings) {
    cachedListings = [...HOLDING_LISTINGS, ...SEMSARAI_LISTINGS].filter(
      (l) => l.status === "published" && !l.isDemo,
    );
  }
  return cachedListings;
}

export function resetStaticCatalogCache(): void {
  cachedListings = null;
}
