import { getAggregatedListings } from "@/lib/aggregation/sync";
import { DEMO_LISTINGS, EXCHANGE_RATES, type DemoListing } from "@/lib/data/demo-data";
import { SEMSARAI_LISTINGS } from "@/lib/data/semsarai-listings";
import { HOLDING_LISTINGS } from "@/lib/data/holding-listings";
import type { AggregatedListing } from "@/lib/aggregation/types";
import { useDatabase } from "@/lib/db/repository";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import * as dbRepo from "@/server/repositories/listings-db";
import { syncListingEmbedding } from "@/server/repositories/embedding-sync";
import { searchSemsaraiLive } from "@/lib/semsarai/live-search";

const USE_LIVE_SEARCH = process.env.SEMSARAI_LIVE_SEARCH !== "false";

export type ListingWithLocation = DemoListing & {
  aggregationSource?: AggregatedListing["aggregationSource"];
  isExternal?: boolean;
  licenseStatus?: AggregatedListing["licenseStatus"];
};

function matchesFilters(listing: ListingWithLocation, filters: SearchFilters): boolean {
  if (listing.status !== "published" && !filters.query?.includes("admin")) return false;
  if (listing.isDemo) return false;
  if (filters.source && "aggregationSource" in listing) {
    const src = (listing as AggregatedListing).aggregationSource;
    if (src !== filters.source) return false;
  }
  if (filters.transactionType && listing.transactionType !== filters.transactionType) return false;
  if (filters.listingType && listing.listingType !== filters.listingType) return false;
  if (filters.city && listing.location.city.toLowerCase() !== filters.city.toLowerCase()) return false;
  if (filters.neighborhood && listing.location.neighborhood.toLowerCase() !== filters.neighborhood.toLowerCase()) return false;
  if (filters.minPrice && listing.price < filters.minPrice) return false;
  if (filters.maxPrice && listing.price > filters.maxPrice) return false;
  if (filters.minArea && (listing.livingArea ?? 0) < filters.minArea) return false;
  if (filters.maxArea && (listing.livingArea ?? 99999) > filters.maxArea) return false;
  if (filters.bedrooms && (listing.bedrooms ?? 0) < filters.bedrooms) return false;
  if (filters.hasPool && !listing.hasPool) return false;
  if (filters.hasParking && !listing.hasParking) return false;
  if (filters.isVerified && !listing.isVerified) return false;
  if (filters.isNew && !listing.isNew) return false;
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const haystack = `${listing.title} ${listing.description} ${listing.location.city} ${listing.location.neighborhood}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function listingPriority(listing: ListingWithLocation): number {
  if (listing.isDemo) return 0;
  if (listing.aggregationSource === "semsarai") return 4;
  if (listing.aggregationSource === "holding-immo") return 3;
  if (listing.isExternal) return 2;
  return 1;
}

function sortListings(listings: ListingWithLocation[], sort?: SearchFilters["sort"]): ListingWithLocation[] {
  const copy = [...listings];
  const byPriority = (a: ListingWithLocation, b: ListingWithLocation) =>
    listingPriority(b) - listingPriority(a);

  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price || byPriority(a, b));
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price || byPriority(a, b));
    case "area_desc":
      return copy.sort((a, b) => (b.livingArea ?? 0) - (a.livingArea ?? 0) || byPriority(a, b));
    default:
      return copy.sort(
        (a, b) =>
          byPriority(a, b) ||
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
  }
}

async function liveSearchListings(filters: SearchFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 48;
  const result = await searchSemsaraiLive({ ...filters, page, limit });
  return {
    items: result.items as ListingWithLocation[],
    total: result.total,
    totalAvailable: result.totalAvailable,
    page: result.page,
    totalPages: result.totalPages,
  };
}

async function demoSearchListings(filters: SearchFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  const all = await getAggregatedListings();
  const filtered = sortListings(
    all.filter((l) => matchesFilters(l, filters)),
    filters.sort,
  );
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);
  return {
    items,
    total: filtered.length,
    page,
    totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
  };
}

export async function searchListings(filters: SearchFilters = {}): Promise<{
  items: ListingWithLocation[];
  total: number;
  page: number;
  totalPages: number;
  totalAvailable?: number;
}> {
  if (useDatabase()) {
    const result = await dbRepo.dbSearchListings(filters);
    if (result) return result;
  }
  if (USE_LIVE_SEARCH) {
    return liveSearchListings(filters);
  }
  return demoSearchListings(filters);
}

export async function getListingBySlug(slug: string): Promise<ListingWithLocation | null> {
  if (useDatabase()) {
    const listing = await dbRepo.dbGetListingBySlug(slug);
    if (listing) return listing;
  }
  const staticHit =
    HOLDING_LISTINGS.find((l) => l.slug === slug) ??
    SEMSARAI_LISTINGS.find((l) => l.slug === slug);
  if (staticHit) return staticHit as ListingWithLocation;

  const all = await getAggregatedListings();
  return all.find((l) => l.slug === slug) ?? null;
}

export async function getListingById(id: string): Promise<ListingWithLocation | null> {
  if (useDatabase()) {
    const listing = await dbRepo.dbGetListingById(id);
    if (listing) return listing;
  }
  const all = await getAggregatedListings();
  return all.find((l) => l.id === id) ?? null;
}

export async function getFeaturedListings(limit = 6): Promise<ListingWithLocation[]> {
  if (useDatabase()) {
    const items = await dbRepo.dbGetFeaturedListings(limit);
    if (items.length > 0) return items;
  }
  if (USE_LIVE_SEARCH) {
    const { items } = await searchSemsaraiLive({ limit, page: 1 });
    return items.slice(0, limit) as ListingWithLocation[];
  }
  const all = await getAggregatedListings();
  return all
    .filter((l) => l.status === "published" && !l.isDemo)
    .sort(
      (a, b) =>
        listingPriority(b) - listingPriority(a) ||
        b.completenessScore - a.completenessScore,
    )
    .slice(0, limit);
}

export async function getPendingListings(): Promise<ListingWithLocation[]> {
  if (useDatabase()) {
    const items = await dbRepo.dbGetPendingListings();
    if (items.length > 0) return items;
  }
  return DEMO_LISTINGS.filter((l) => l.status === "pending_review" || l.status === "draft");
}

export async function getCities(): Promise<Array<{ city: string; count: number }>> {
  if (useDatabase()) {
    const cities = await dbRepo.dbGetCities();
    if (cities.length > 0) return cities;
  }
  const map = new Map<string, number>();
  const all = await getAggregatedListings();
  for (const l of all.filter((x) => x.status === "published")) {
    map.set(l.location.city, (map.get(l.location.city) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([city, count]) => ({ city, count }));
}

export function convertPrice(
  amount: number,
  from: "MAD" | "EUR" | "USD",
  to: "MAD" | "EUR" | "USD",
): { amount: number; rate: number; date: string; source: string } {
  const inMad = amount / EXCHANGE_RATES[from];
  const converted = inMad * EXCHANGE_RATES[to];
  const rate = EXCHANGE_RATES[to] / EXCHANGE_RATES[from];
  return {
    amount: Math.round(converted),
    rate,
    date: EXCHANGE_RATES.date,
    source: EXCHANGE_RATES.source,
  };
}

const draftStore: DemoListing[] = [];

export function addDraftListing(listing: DemoListing) {
  draftStore.push(listing);
  DEMO_LISTINGS.push(listing);
}

export async function approveListing(id: string): Promise<boolean> {
  if (useDatabase()) {
    const ok = await dbRepo.dbApproveListing(id);
    if (ok) return true;
  }
  const listing = DEMO_LISTINGS.find((l) => l.id === id);
  if (!listing) return false;
  listing.status = "published";
  listing.publishedAt = new Date().toISOString();
  void syncListingEmbedding(listing);
  return true;
}

export async function rejectListing(id: string): Promise<boolean> {
  if (useDatabase()) {
    const ok = await dbRepo.dbRejectListing(id);
    if (ok) return true;
  }
  const listing = DEMO_LISTINGS.find((l) => l.id === id);
  if (!listing) return false;
  listing.status = "rejected";
  return true;
}
