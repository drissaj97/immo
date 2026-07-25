import { fetchHoldingListings } from "@/lib/aggregation/sources/holding-source";
import { loadSemsaraiListings } from "@/lib/data/static-catalog-loader";
import { normalizeSemsaraiListing } from "@/lib/semsarai/normalizer";
import type { AggregatedListing } from "@/lib/aggregation/types";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { listingMatchesFilters } from "@/lib/search/listing-filters-match";

let catalogPromise: Promise<AggregatedListing[]> | null = null;

async function getSearchCatalog(): Promise<AggregatedListing[]> {
  if (!catalogPromise) {
    catalogPromise = loadSemsaraiListings().then((semsarai) => [
      ...fetchHoldingListings(),
      ...semsarai.map(normalizeSemsaraiListing),
    ]);
  }
  return catalogPromise;
}

/** Recherche dans le catalogue embarqué (~5050 annonces), chargement lazy. */
export async function searchLocalCatalog(filters: SearchFilters = {}): Promise<AggregatedListing[]> {
  const listings = await getSearchCatalog();
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

export function resetLocalCatalogCache(): void {
  catalogPromise = null;
}
