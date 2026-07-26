import type { DemoListing } from "@/lib/data/demo-data";

/** Texte d'embedding — module léger (ne charge pas le catalogue SEMSAR). */
export function listingEmbeddingText(listing: DemoListing): string {
  return `${listing.title} ${listing.description} ${listing.location.city} ${listing.location.neighborhood} ${listing.listingType} ${listing.transactionType}`;
}
