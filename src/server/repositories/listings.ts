import { HOLDING_LISTINGS } from "@/lib/data/holding-listings";
import { loadSemsaraiListings } from "@/lib/data/static-catalog-loader";
import type { AggregatedListing } from "@/lib/aggregation/types";
import { useDatabase } from "@/lib/db/repository";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import * as dbRepo from "@/server/repositories/listings-db";
import { searchSemsaraiLive } from "@/lib/semsarai/live-search";
import {
  buildFallbackFromListings,
  getAllCities,
  getAllRegions,
  getGeographyIndex,
} from "@/lib/geography/index";
import { DEMO_LISTINGS, type DemoListing } from "@/lib/data/demo-data";
import { resolveMoroccoRegion } from "@/lib/geography/morocco-regions";
import { cityMatches, neighborhoodMatches } from "@/lib/search/location-match";
import { enrichSearchFilters, hasCompleteLocation } from "@/lib/search/location-gate";
import { fetchHoldingListings } from "@/lib/aggregation/sources/holding-source";
import { LISTINGS_PAGE_SIZE } from "@/lib/search/page-size";
import { matchesTransactionFilter } from "@/lib/search/effective-transaction-type";

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
  if (filters.transactionType) {
    if (!matchesTransactionFilter(listing, filters.transactionType)) return false;
  }
  if (filters.listingType && listing.listingType !== filters.listingType) return false;
  if (filters.region) {
    const listingRegion = resolveMoroccoRegion(
      listing.location.city,
      listing.location.region ?? listing.location.city,
    );
    if (listingRegion.toLowerCase() !== filters.region.toLowerCase()) return false;
  }
  if (filters.city && !cityMatches(filters.city, listing)) return false;
  if (filters.neighborhood && !neighborhoodMatches(filters.neighborhood, listing)) return false;
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
  if (listing.aggregationSource === "holding-immo") return 3;
  if (
    listing.aggregationSource === "mubawab" ||
    listing.aggregationSource === "avito" ||
    listing.aggregationSource === "sarouty" ||
    listing.aggregationSource === "agenz" ||
    listing.aggregationSource === "yakeey"
  ) {
    return 2;
  }
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

async function getAggregatedListingsLazy(): Promise<AggregatedListing[]> {
  const { getAggregatedListings } = await import("@/lib/aggregation/sync");
  return getAggregatedListings();
}

async function liveSearchListings(filters: SearchFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? LISTINGS_PAGE_SIZE;
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
  const limit = filters.limit ?? LISTINGS_PAGE_SIZE;
  const all = await getAggregatedListingsLazy();
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
  const enriched = enrichSearchFilters(filters);
  if (!hasCompleteLocation(enriched)) {
    return { items: [], total: 0, page: enriched.page ?? 1, totalPages: 1, totalAvailable: 0 };
  }

  if (useDatabase()) {
    const result = await dbRepo.dbSearchListings(enriched);
    if (result) return result;
  }
  if (USE_LIVE_SEARCH) {
    return liveSearchListings(enriched);
  }
  return demoSearchListings(enriched);
}

async function findInPartnerFeeds(slug: string): Promise<ListingWithLocation | null> {
  const { fetchPartnerFeed } = await import("@/lib/aggregation/sources/partner-feed");
  const sources = ["avito", "mubawab", "sarouty"] as const;
  // Priorité au préfixe du slug (ex. mubawab-7881114)
  const ordered = [
    ...sources.filter((s) => slug.startsWith(`${s}-`)),
    ...sources.filter((s) => !slug.startsWith(`${s}-`)),
  ];
  for (const source of ordered) {
    const feed = await fetchPartnerFeed(source);
    const hit = feed.find((l) => l.slug === slug || l.id === slug);
    if (hit) return hit as ListingWithLocation;
  }
  return null;
}

export async function getListingBySlug(slug: string): Promise<ListingWithLocation | null> {
  if (useDatabase()) {
    const listing = await dbRepo.dbGetListingBySlug(slug);
    if (listing) return listing;
  }

  const holdingHit = HOLDING_LISTINGS.find((l) => l.slug === slug);
  if (holdingHit) return holdingHit as ListingWithLocation;

  const partnerHit = await findInPartnerFeeds(slug);
  if (partnerHit) return partnerHit;

  const semsar = await loadSemsaraiListings();
  const semsarHit = semsar.find((l) => l.slug === slug);
  if (semsarHit) return semsarHit as ListingWithLocation;

  if (!USE_LIVE_SEARCH) {
    const all = await getAggregatedListingsLazy();
    return all.find((l) => l.slug === slug) ?? null;
  }

  return null;
}

export async function getListingById(id: string): Promise<ListingWithLocation | null> {
  if (useDatabase()) {
    const listing = await dbRepo.dbGetListingById(id);
    if (listing) return listing;
  }
  const all = await getAggregatedListingsLazy();
  return all.find((l) => l.id === id) ?? null;
}

export async function getFeaturedListings(limit = 6): Promise<ListingWithLocation[]> {
  if (useDatabase()) {
    const items = await dbRepo.dbGetFeaturedListings(limit);
    if (items.length > 0) return items;
  }

  const holding = fetchHoldingListings().slice(0, limit) as ListingWithLocation[];
  if (holding.length >= limit) return holding;

  const semsarai = await loadSemsaraiListings();
  const extras = semsarai
    .filter((l) => l.status === "published" && !l.isDemo)
    .slice(0, limit - holding.length) as ListingWithLocation[];

  return [...holding, ...extras].slice(0, limit);
}

export async function getPendingListings(): Promise<ListingWithLocation[]> {
  if (useDatabase()) {
    const items = await dbRepo.dbGetPendingListings();
    if (items.length > 0) return items;
  }
  return DEMO_LISTINGS.filter((l) => l.status === "pending_review" || l.status === "draft");
}

export async function getCities(): Promise<Array<{ city: string; count: number; region?: string }>> {
  const index = getGeographyIndex();
  if (index && index.cities.length > 0) {
    return index.cities.map((c) => ({ city: c.name, count: c.count, region: c.region }));
  }

  if (useDatabase()) {
    const cities = await dbRepo.dbGetCities();
    if (cities.length > 0) return cities;
  }

  const all = await getAggregatedListingsLazy();
  const fallback = buildFallbackFromListings(all.filter((x) => x.status === "published"));
  return fallback.cities.map((c) => ({ city: c.name, count: c.count, region: c.region }));
}

export async function getRegions(): Promise<
  Array<{ region: string; count: number; cities: string[]; slug: string }>
> {
  const index = getGeographyIndex();
  if (index && index.regions.length > 0) {
    return index.regions.map((r) => ({
      region: r.name,
      count: r.count,
      cities: r.cities,
      slug: r.slug,
    }));
  }

  const cities = await getCities();
  const regionMap = new Map<string, { count: number; cities: Set<string> }>();
  for (const { city, count, region } of cities) {
    const r = region ?? city;
    const entry = regionMap.get(r) ?? { count: 0, cities: new Set<string>() };
    entry.count += count;
    entry.cities.add(city);
    regionMap.set(r, entry);
  }

  return Array.from(regionMap.entries())
    .map(([region, data]) => ({
      region,
      count: data.count,
      cities: Array.from(data.cities).sort((a, b) => a.localeCompare(b, "fr")),
      slug: region
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getCityIndex(cityName: string) {
  return getAllCities().find((c) => c.name.toLowerCase() === cityName.toLowerCase());
}

export async function getRegionIndex(regionSlug: string) {
  return getAllRegions().find((r) => r.slug === regionSlug.toLowerCase());
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
  void import("@/server/repositories/embedding-sync").then(({ syncListingEmbedding }) =>
    syncListingEmbedding(listing),
  );
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
