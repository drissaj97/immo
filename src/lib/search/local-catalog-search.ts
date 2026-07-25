import { fetchHoldingListings } from "@/lib/aggregation/sources/holding-source";
import {
  fetchPartnerFeedForCity,
  resetPartnerFeedCache,
} from "@/lib/aggregation/sources/partner-feed";
import { loadSemsaraiListings } from "@/lib/data/static-catalog-loader";
import { normalizeSemsaraiListing } from "@/lib/semsarai/normalizer";
import type { AggregatedListing, AggregationSourceId } from "@/lib/aggregation/types";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { listingMatchesFilters } from "@/lib/search/listing-filters-match";
import { hasNeighborhoodCatalog } from "@/lib/search/neighborhood-catalog";

const PARTNER_SOURCES: AggregationSourceId[] = ["avito", "mubawab", "sarouty"];

let catalogPromise: Promise<AggregatedListing[]> | null = null;
const partnerByCity = new Map<string, Promise<AggregatedListing[]>>();

async function getSearchCatalog(): Promise<AggregatedListing[]> {
  if (!catalogPromise) {
    catalogPromise = loadSemsaraiListings().then((semsarai) => [
      ...fetchHoldingListings(),
      ...semsarai.map(normalizeSemsaraiListing),
    ]);
  }
  return catalogPromise;
}

async function getPartnerCatalog(city?: string): Promise<AggregatedListing[]> {
  const key = (city ?? "").trim().toLowerCase() || "*";
  let pending = partnerByCity.get(key);
  if (!pending) {
    pending = Promise.all(
      PARTNER_SOURCES.map((source) => fetchPartnerFeedForCity(source, city)),
    ).then((groups) => groups.flat());
    partnerByCity.set(key, pending);
  }
  return pending;
}

function pushMatches(
  matched: AggregatedListing[],
  listings: AggregatedListing[],
  filters: SearchFilters,
) {
  for (const listing of listings) {
    if (listing.status === "published" && listingMatchesFilters(listing, filters)) {
      matched.push(listing);
    }
  }
}

/**
 * Recherche locale.
 * Si un cache quartier existe pour la ville, on évite de charger les 5000 SEMSAR
 * (déjà couverts par neighborhood-catalog) — réduit fortement la RAM.
 */
export async function searchLocalCatalog(filters: SearchFilters = {}): Promise<AggregatedListing[]> {
  const matched: AggregatedListing[] = [];
  const useNeighborhoodCache =
    Boolean(filters.city && filters.neighborhood && hasNeighborhoodCatalog(filters.city));

  const partner = await getPartnerCatalog(filters.city);
  pushMatches(matched, partner, filters);

  if (useNeighborhoodCache) {
    // Holding only — le reste SEMSAR vient du cache quartier dans live-search
    pushMatches(matched, fetchHoldingListings(), filters);
    return matched;
  }

  const listings = await getSearchCatalog();
  pushMatches(matched, listings, filters);
  return matched;
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
  partnerByCity.clear();
  resetPartnerFeedCache();
}
