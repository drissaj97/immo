import { fetchSemsaraiProperties } from "@/lib/semsarai/client";
import { semsaraiPropertyToListing } from "@/lib/semsarai/normalizer";
import { normalizeSemsaraiListing } from "@/lib/semsarai/normalizer";
import { fetchHoldingListings } from "@/lib/aggregation/sources/holding-source";
import type { AggregatedListing } from "@/lib/aggregation/types";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { hasActiveFilters, listingMatchesFilters } from "@/lib/search/listing-filters-match";

const API_PAGE_SIZE = Number(process.env.SEMSARAI_PAGE_SIZE ?? "50");
const MAX_SCAN_PAGES = Number(process.env.SEMSARAI_SEARCH_SCAN_PAGES ?? "300");

function sortListings(listings: AggregatedListing[], sort?: SearchFilters["sort"]): AggregatedListing[] {
  const copy = [...listings];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "area_desc":
      return copy.sort((a, b) => (b.livingArea ?? 0) - (a.livingArea ?? 0));
    default:
      return copy.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
  }
}

function holdingMatches(filters: SearchFilters): AggregatedListing[] {
  return fetchHoldingListings().filter((l) => listingMatchesFilters(l, filters));
}

/** Recherche live via API semsarai.ma — accès aux ~73k annonces sans limite statique. */
export async function searchSemsaraiLive(filters: SearchFilters = {}): Promise<{
  items: AggregatedListing[];
  total: number;
  totalAvailable: number;
  page: number;
  totalPages: number;
  scannedPages: number;
}> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 48;
  const holding = holdingMatches(filters);
  const activeFilters = hasActiveFilters(filters);

  if (!activeFilters) {
    const apiPage = page;
    const batch = await fetchSemsaraiProperties({ page: apiPage, limit: API_PAGE_SIZE });
    const apiItems = batch.properties.map((p) =>
      normalizeSemsaraiListing(semsaraiPropertyToListing(p)),
    );
    const items =
      page === 1 ? [...holding, ...apiItems].slice(0, limit) : apiItems.slice(0, limit);
    const totalAvailable = batch.totalCount + holding.length;
    return {
      items,
      total: totalAvailable,
      totalAvailable,
      page,
      totalPages: Math.max(1, Math.ceil(totalAvailable / limit)),
      scannedPages: 1,
    };
  }

  const matched: AggregatedListing[] = [...holding];
  let apiPage = 1;
  let scannedPages = 0;

  while (apiPage <= MAX_SCAN_PAGES) {
    const batch = await fetchSemsaraiProperties({ page: apiPage, limit: API_PAGE_SIZE });
    scannedPages += 1;
    if (!batch.properties.length) break;

    for (const property of batch.properties) {
      const listing = normalizeSemsaraiListing(semsaraiPropertyToListing(property));
      if (listingMatchesFilters(listing, filters)) {
        matched.push(listing);
      }
    }

    if (batch.properties.length < API_PAGE_SIZE) break;
    apiPage += 1;

    if (!filters.city && !filters.neighborhood && matched.length >= page * limit * 2) {
      break;
    }
  }

  const sorted = sortListings(matched, filters.sort);
  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit);

  const firstBatch = await fetchSemsaraiProperties({ page: 1, limit: 1 });
  const totalAvailable = firstBatch.totalCount + holding.length;

  return {
    items,
    total: sorted.length,
    totalAvailable,
    page,
    totalPages: Math.max(1, Math.ceil(sorted.length / limit)),
    scannedPages,
  };
}

export async function getSemsaraiTotalCount(): Promise<number> {
  const batch = await fetchSemsaraiProperties({ page: 1, limit: 1 });
  return batch.totalCount;
}
