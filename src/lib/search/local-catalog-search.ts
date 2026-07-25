import { fetchHoldingListings } from "@/lib/aggregation/sources/holding-source";
import { fetchPartnerFeed } from "@/lib/aggregation/sources/partner-feed";
import { loadSemsaraiListings } from "@/lib/data/static-catalog-loader";
import { normalizeSemsaraiListing } from "@/lib/semsarai/normalizer";
import type { AggregatedListing, AggregationSourceId } from "@/lib/aggregation/types";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { listingMatchesFilters } from "@/lib/search/listing-filters-match";

const PARTNER_SOURCES: AggregationSourceId[] = ["avito", "mubawab", "sarouty"];

let catalogPromise: Promise<AggregatedListing[]> | null = null;
let partnerPromise: Promise<AggregatedListing[]> | null = null;

async function getSearchCatalog(): Promise<AggregatedListing[]> {
  if (!catalogPromise) {
    catalogPromise = loadSemsaraiListings().then((semsarai) => [
      ...fetchHoldingListings(),
      ...semsarai.map(normalizeSemsaraiListing),
    ]);
  }
  return catalogPromise;
}

async function getPartnerCatalog(): Promise<AggregatedListing[]> {
  if (!partnerPromise) {
    partnerPromise = Promise.all(PARTNER_SOURCES.map((source) => fetchPartnerFeed(source))).then(
      (groups) => groups.flat(),
    );
  }
  return partnerPromise;
}

/** Recherche dans le catalogue embarqué + flux scrapés locaux. */
export async function searchLocalCatalog(filters: SearchFilters = {}): Promise<AggregatedListing[]> {
  const [listings, partner] = await Promise.all([getSearchCatalog(), getPartnerCatalog()]);
  const all = [...listings, ...partner];
  return all.filter((l) => l.status === "published" && listingMatchesFilters(l, filters));
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
  partnerPromise = null;
}
