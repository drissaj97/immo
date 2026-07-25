import type { DemoListing } from "@/lib/data/demo-data";
import { HOLDING_LISTINGS } from "@/lib/data/holding-listings";
import { SEMSARAI_LISTINGS } from "@/lib/data/semsarai-listings";

/** Annonces réelles embarquées (Holding IMMO + SEMSAR AI importées). */
export function getStaticCatalogListings(): DemoListing[] {
  return [...HOLDING_LISTINGS, ...SEMSARAI_LISTINGS].filter(
    (l) => l.status === "published" && !l.isDemo,
  );
}

export function listingEmbeddingText(listing: DemoListing): string {
  return `${listing.title} ${listing.description} ${listing.location.city} ${listing.location.neighborhood} ${listing.listingType} ${listing.transactionType}`;
}
