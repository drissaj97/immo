import { fetchSemsaraiProperties } from "@/lib/semsarai/client";
import { semsaraiPropertyToListing, normalizeSemsaraiListing } from "@/lib/semsarai/normalizer";
import type { AggregatedListing } from "@/lib/aggregation/types";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { listingMatchesFilters } from "@/lib/search/listing-filters-match";
import { cityMatches } from "@/lib/search/location-match";

const API_PAGE_SIZE = Number(process.env.SEMSARAI_PAGE_SIZE ?? "50");
const SCAN_CONCURRENCY = Number(process.env.SEMSARAI_SCAN_CONCURRENCY ?? "3");
/** Budget temps max pour le fallback scan (évite pages bloquées 60s+). */
const SCAN_BUDGET_MS = Number(process.env.SEMSARAI_SCAN_BUDGET_MS ?? "2500");
const SCAN_MAX_PAGES = Number(process.env.SEMSARAI_SCAN_MAX_PAGES ?? "12");

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

/**
 * Scan API borné dans le temps (fallback si cache quartier absent).
 * Ne bloque jamais plus de SCAN_BUDGET_MS.
 */
export async function scanApiForNeighborhood(
  filters: SearchFilters,
  seen: Set<string>,
): Promise<AggregatedListing[]> {
  if (!filters.city || !filters.neighborhood) return [];

  const matched: AggregatedListing[] = [];
  const started = Date.now();
  const deadline = started + SCAN_BUDGET_MS;

  const first = await fetchSemsaraiProperties({ page: 1, limit: API_PAGE_SIZE });
  const totalPages = Math.min(
    first.totalPages ?? Math.max(1, Math.ceil(first.totalCount / API_PAGE_SIZE)),
    SCAN_MAX_PAGES,
  );

  matched.push(...ingestProperties(filters, first.properties, seen));
  if (Date.now() >= deadline || totalPages <= 1) return matched;

  let nextPage = 2;
  let emptyStreak = 0;

  async function worker() {
    const local: AggregatedListing[] = [];
    while (Date.now() < deadline) {
      const page = nextPage++;
      if (page > totalPages || emptyStreak >= SCAN_CONCURRENCY) return local;

      try {
        const batch = await fetchSemsaraiProperties({ page, limit: API_PAGE_SIZE });
        if (!batch.properties.length) {
          emptyStreak += 1;
          continue;
        }
        emptyStreak = 0;
        local.push(...ingestProperties(filters, batch.properties, seen));
      } catch {
        emptyStreak += 1;
      }
    }
    return local;
  }

  const groups = await Promise.all(Array.from({ length: SCAN_CONCURRENCY }, () => worker()));
  for (const group of groups) matched.push(...group);

  return matched;
}
