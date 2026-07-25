import { fetchSemsaraiProperties } from "@/lib/semsarai/client";
import { semsaraiPropertyToListing, normalizeSemsaraiListing } from "@/lib/semsarai/normalizer";
import type { AggregatedListing } from "@/lib/aggregation/types";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { getNeighborhoodListingCount } from "@/lib/geography/neighborhood-count";
import { listingMatchesFilters } from "@/lib/search/listing-filters-match";
import { cityMatches } from "@/lib/search/location-match";

const API_PAGE_SIZE = Number(process.env.SEMSARAI_PAGE_SIZE ?? "50");
const SCAN_CONCURRENCY = Number(process.env.SEMSARAI_SCAN_CONCURRENCY ?? "3");

function ingestProperties(
  filters: SearchFilters,
  properties: Parameters<typeof semsaraiPropertyToListing>[0][],
  seen: Set<string>,
): AggregatedListing[] {
  const batch: AggregatedListing[] = [];
  for (const property of properties) {
    const listing = normalizeSemsaraiListing(semsaraiPropertyToListing(property));
    if (!cityMatches(filters.city!, listing)) continue;
    if (!listingMatchesFilters(listing, filters) || seen.has(listing.id)) continue;
    seen.add(listing.id);
    batch.push(listing);
  }
  return batch;
}

/** Scan API complet jusqu'à couvrir le quartier (fallback si cache absent). */
export async function scanApiForNeighborhood(
  filters: SearchFilters,
  seen: Set<string>,
): Promise<AggregatedListing[]> {
  if (!filters.city || !filters.neighborhood) return [];

  const expected = getNeighborhoodListingCount(filters.city, filters.neighborhood);
  const matched: AggregatedListing[] = [];

  const first = await fetchSemsaraiProperties({ page: 1, limit: API_PAGE_SIZE });
  const totalPages = first.totalPages ?? Math.max(1, Math.ceil(first.totalCount / API_PAGE_SIZE));

  matched.push(...ingestProperties(filters, first.properties, seen));
  if (expected && matched.length >= expected) return matched;
  if (totalPages <= 1) return matched;

  let nextPage = 2;
  let emptyStreak = 0;
  let totalFound = matched.length;

  async function worker() {
    const local: AggregatedListing[] = [];
    while (true) {
      const page = nextPage++;
      if (page > totalPages || emptyStreak >= SCAN_CONCURRENCY) return local;
      if (expected && totalFound >= expected) return local;

      try {
        const batch = await fetchSemsaraiProperties({ page, limit: API_PAGE_SIZE });
        if (!batch.properties.length) {
          emptyStreak += 1;
          continue;
        }
        emptyStreak = 0;
        const found = ingestProperties(filters, batch.properties, seen);
        local.push(...found);
        totalFound += found.length;
      } catch {
        emptyStreak += 1;
      }
    }
  }

  const groups = await Promise.all(Array.from({ length: SCAN_CONCURRENCY }, () => worker()));
  for (const group of groups) matched.push(...group);

  return matched;
}
