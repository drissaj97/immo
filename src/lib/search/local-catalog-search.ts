import { getStaticCatalogListings } from "@/lib/aggregation/catalog";
import { fetchHoldingListings } from "@/lib/aggregation/sources/holding-source";
import { normalizeSemsaraiListing } from "@/lib/semsarai/normalizer";
import type { AggregatedListing } from "@/lib/aggregation/types";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { listingMatchesFilters } from "@/lib/search/listing-filters-match";

/** Recherche instantanée dans le catalogue embarqué (~5050 annonces). */
export function searchLocalCatalog(filters: SearchFilters = {}): AggregatedListing[] {
  const listings = [
    ...fetchHoldingListings(),
    ...getStaticCatalogListings().map(normalizeSemsaraiListing),
  ];

  return listings.filter((l) => l.status === "published" && listingMatchesFilters(l, filters));
}

export function mergeListingsById(...groups: AggregatedListing[][]): AggregatedListing[] {
  const seen = new Set<string>();
  const merged: AggregatedListing[] = [];
  for (const group of groups) {
    for (const listing of group) {
      if (seen.has(listing.id)) continue;
      seen.add(listing.id);
      merged.push(listing);
    }
  }
  return merged;
}
