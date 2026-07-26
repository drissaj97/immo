import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import type { DemoListing, DemoLocation } from "@/lib/data/demo-data";
import { getDb } from "@/lib/db";
import { listingMedia, listings, locations } from "@/lib/db/schema";
import type { SearchFilters } from "@/modules/search/natural-language-parser";

type ListingRow = typeof listings.$inferSelect;
type LocationRow = typeof locations.$inferSelect;

function mapLocation(loc: LocationRow | null, listing: ListingRow): DemoLocation {
  if (loc) {
    const latitude = Number(loc.latitude ?? listing.latitude);
    const longitude = Number(loc.longitude ?? listing.longitude);
    return {
      id: loc.id,
      city: loc.city,
      neighborhood: loc.neighborhood ?? loc.district ?? loc.city,
      region: loc.region ?? "Maroc",
      slug: loc.slug,
      latitude: Number.isFinite(latitude) ? latitude : 33.5,
      longitude: Number.isFinite(longitude) ? longitude : -7.5,
    };
  }
  const latitude = Number(listing.latitude);
  const longitude = Number(listing.longitude);
  return {
    id: "unknown",
    city: "Maroc",
    neighborhood: "",
    region: "Maroc",
    slug: "maroc",
    latitude: Number.isFinite(latitude) ? latitude : 33.5,
    longitude: Number.isFinite(longitude) ? longitude : -7.5,
  };
}

function mapListing(
  listing: ListingRow,
  loc: LocationRow | null,
  images: string[],
): DemoListing {
  return {
    id: listing.externalId ?? listing.id,
    slug: listing.slug,
    title: listing.title,
    description: listing.description ?? "",
    transactionType: listing.transactionType,
    listingType: listing.listingType as DemoListing["listingType"],
    status: listing.status,
    price: listing.price,
    currency: listing.currency,
    livingArea: listing.livingArea ?? undefined,
    landArea: listing.landArea ?? undefined,
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    hasPool: listing.hasPool ?? undefined,
    hasParking: listing.hasParking ?? undefined,
    hasGarden: listing.hasGarden ?? undefined,
    hasTerrace: listing.hasTerrace ?? undefined,
    hasElevator: listing.hasElevator ?? undefined,
    isFurnished: listing.isFurnished ?? undefined,
    hasTitleDeed: listing.hasTitleDeed ?? undefined,
    isNew: listing.isNew ?? undefined,
    location: mapLocation(loc, listing),
    latitude: (() => {
      const n = Number(listing.latitude ?? loc?.latitude);
      return Number.isFinite(n) ? n : 33.5;
    })(),
    longitude: (() => {
      const n = Number(listing.longitude ?? loc?.longitude);
      return Number.isFinite(n) ? n : -7.5;
    })(),
    reference: listing.reference ?? listing.id.slice(0, 8),
    images,
    sourceType: listing.sourceType ?? "first_party",
    sourceName: listing.sourceName ?? "DarBladi",
    completenessScore: listing.completenessScore ?? 0,
    freshnessScore: listing.freshnessScore ?? 0,
    isVerified: listing.isVerified ?? false,
    isDemo: true,
    publishedAt: listing.publishedAt?.toISOString() ?? listing.createdAt.toISOString(),
  };
}

async function fetchMedia(listingIds: string[]): Promise<Map<string, string[]>> {
  const db = getDb();
  if (!db || listingIds.length === 0) return new Map();
  const rows = await db
    .select({ listingId: listingMedia.listingId, url: listingMedia.url, sortOrder: listingMedia.sortOrder })
    .from(listingMedia)
    .where(inArray(listingMedia.listingId, listingIds))
    .orderBy(asc(listingMedia.sortOrder));
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const arr = map.get(row.listingId) ?? [];
    arr.push(row.url);
    map.set(row.listingId, arr);
  }
  return map;
}

async function hydrateRows(
  rows: Array<{ listing: ListingRow; location: LocationRow | null }>,
): Promise<DemoListing[]> {
  const ids = rows.map((r) => r.listing.id);
  const mediaMap = await fetchMedia(ids);
  return rows.map(({ listing, location }) =>
    mapListing(listing, location, mediaMap.get(listing.id) ?? []),
  );
}

function buildConditions(filters: SearchFilters) {
  const conditions = [];
  if (!filters.query?.includes("admin")) {
    conditions.push(eq(listings.status, "published"));
  }
  if (filters.transactionType) conditions.push(eq(listings.transactionType, filters.transactionType));
  if (filters.listingType) conditions.push(eq(listings.listingType, filters.listingType));
  if (filters.minPrice) conditions.push(gte(listings.price, filters.minPrice));
  if (filters.maxPrice) conditions.push(lte(listings.price, filters.maxPrice));
  if (filters.minArea) conditions.push(gte(listings.livingArea, filters.minArea));
  if (filters.maxArea) conditions.push(lte(listings.livingArea, filters.maxArea));
  if (filters.bedrooms) conditions.push(gte(listings.bedrooms, filters.bedrooms));
  if (filters.hasPool) conditions.push(eq(listings.hasPool, true));
  if (filters.hasParking) conditions.push(eq(listings.hasParking, true));
  if (filters.isVerified) conditions.push(eq(listings.isVerified, true));
  if (filters.isNew) conditions.push(eq(listings.isNew, true));
  if (filters.city) conditions.push(ilike(locations.city, filters.city));
  if (filters.neighborhood) conditions.push(ilike(locations.neighborhood, filters.neighborhood));
  if (filters.query) {
    const q = `%${filters.query}%`;
    conditions.push(
      or(
        ilike(listings.title, q),
        ilike(listings.description, q),
        ilike(locations.city, q),
        ilike(locations.neighborhood, q),
      )!,
    );
  }
  return conditions;
}

function orderBy(filters: SearchFilters) {
  switch (filters.sort) {
    case "price_asc":
      return asc(listings.price);
    case "price_desc":
      return desc(listings.price);
    case "area_desc":
      return desc(listings.livingArea);
    default:
      return desc(listings.publishedAt);
  }
}

export async function dbSearchListings(filters: SearchFilters = {}) {
  const db = getDb();
  if (!db) return null;

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  const offset = (page - 1) * limit;
  const conditions = buildConditions(filters);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const baseQuery = db
    .select({ listing: listings, location: locations })
    .from(listings)
    .leftJoin(locations, eq(listings.locationId, locations.id))
    .where(where)
    .orderBy(orderBy(filters));

  const [rows, countResult] = await Promise.all([
    baseQuery.limit(limit).offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .leftJoin(locations, eq(listings.locationId, locations.id))
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const items = await hydrateRows(rows);
  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function dbGetListingBySlug(slug: string): Promise<DemoListing | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select({ listing: listings, location: locations })
    .from(listings)
    .leftJoin(locations, eq(listings.locationId, locations.id))
    .where(eq(listings.slug, slug))
    .limit(1);
  if (!rows[0]) return null;
  const [item] = await hydrateRows(rows);
  return item ?? null;
}

export async function dbGetListingById(id: string): Promise<DemoListing | null> {
  const db = getDb();
  if (!db) return null;
  const rows = await db
    .select({ listing: listings, location: locations })
    .from(listings)
    .leftJoin(locations, eq(listings.locationId, locations.id))
    .where(or(eq(listings.id, id), eq(listings.externalId, id))!)
    .limit(1);
  if (!rows[0]) return null;
  const [item] = await hydrateRows(rows);
  return item ?? null;
}

export async function dbGetFeaturedListings(limit = 6): Promise<DemoListing[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ listing: listings, location: locations })
    .from(listings)
    .leftJoin(locations, eq(listings.locationId, locations.id))
    .where(eq(listings.status, "published"))
    .orderBy(desc(listings.completenessScore))
    .limit(limit);
  return hydrateRows(rows);
}

export async function dbGetPendingListings(): Promise<DemoListing[]> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ listing: listings, location: locations })
    .from(listings)
    .leftJoin(locations, eq(listings.locationId, locations.id))
    .where(or(eq(listings.status, "pending_review"), eq(listings.status, "draft"))!)
    .orderBy(desc(listings.createdAt));
  return hydrateRows(rows);
}

export async function dbGetCities(): Promise<Array<{ city: string; count: number }>> {
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({ city: locations.city, count: sql<number>`count(*)::int` })
    .from(listings)
    .innerJoin(locations, eq(listings.locationId, locations.id))
    .where(eq(listings.status, "published"))
    .groupBy(locations.city);
  return rows.map((r) => ({ city: r.city, count: r.count }));
}

export async function dbApproveListing(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const result = await db
    .update(listings)
    .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(or(eq(listings.id, id), eq(listings.externalId, id))!)
    .returning({ id: listings.id });
  return result.length > 0;
}

export async function dbRejectListing(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const result = await db
    .update(listings)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(or(eq(listings.id, id), eq(listings.externalId, id))!)
    .returning({ id: listings.id });
  return result.length > 0;
}
