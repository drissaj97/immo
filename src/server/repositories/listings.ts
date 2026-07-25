import { DEMO_LISTINGS, EXCHANGE_RATES, type DemoListing } from "@/lib/data/demo-data";
import type { SearchFilters } from "@/modules/search/natural-language-parser";

export type ListingWithLocation = DemoListing;

function matchesFilters(listing: DemoListing, filters: SearchFilters): boolean {
  if (listing.status !== "published" && !filters.query?.includes("admin")) return false;
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

function sortListings(listings: DemoListing[], sort?: SearchFilters["sort"]): DemoListing[] {
  const copy = [...listings];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "area_desc":
      return copy.sort((a, b) => (b.livingArea ?? 0) - (a.livingArea ?? 0));
    default:
      return copy.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
}

export async function searchListings(filters: SearchFilters = {}): Promise<{
  items: ListingWithLocation[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  const filtered = sortListings(
    DEMO_LISTINGS.filter((l) => matchesFilters(l, filters)),
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

export async function getListingBySlug(slug: string): Promise<ListingWithLocation | null> {
  return DEMO_LISTINGS.find((l) => l.slug === slug) ?? null;
}

export async function getListingById(id: string): Promise<ListingWithLocation | null> {
  return DEMO_LISTINGS.find((l) => l.id === id) ?? null;
}

export async function getFeaturedListings(limit = 6): Promise<ListingWithLocation[]> {
  return DEMO_LISTINGS.filter((l) => l.status === "published")
    .sort((a, b) => b.completenessScore - a.completenessScore)
    .slice(0, limit);
}

export async function getPendingListings(): Promise<ListingWithLocation[]> {
  return DEMO_LISTINGS.filter((l) => l.status === "pending_review" || l.status === "draft");
}

export async function getCities(): Promise<Array<{ city: string; count: number }>> {
  const map = new Map<string, number>();
  for (const l of DEMO_LISTINGS.filter((x) => x.status === "published")) {
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

// In-memory store for drafts created during demo sessions
const draftStore: DemoListing[] = [];

export function addDraftListing(listing: DemoListing) {
  draftStore.push(listing);
  DEMO_LISTINGS.push(listing);
}

export function approveListing(id: string): boolean {
  const listing = DEMO_LISTINGS.find((l) => l.id === id);
  if (!listing) return false;
  listing.status = "published";
  listing.publishedAt = new Date().toISOString();
  return true;
}

export function rejectListing(id: string): boolean {
  const listing = DEMO_LISTINGS.find((l) => l.id === id);
  if (!listing) return false;
  listing.status = "rejected";
  return true;
}
