import { and, eq, or } from "drizzle-orm";
import { DEMO_LISTINGS } from "@/lib/data/demo-data";
import { getDb } from "@/lib/db";
import { useDatabase } from "@/lib/db/repository";
import { favorites, listings } from "@/lib/db/schema";
import { getListingById } from "@/server/repositories/listings";
import type { ListingWithLocation } from "@/server/repositories/listings";

const demoFavorites = new Map<string, Set<string>>();

export async function listFavoriteIds(userId: string): Promise<string[]> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .select({ listingId: favorites.listingId, externalId: listings.externalId })
        .from(favorites)
        .innerJoin(listings, eq(favorites.listingId, listings.id))
        .where(eq(favorites.userId, userId));
      return rows.map((r) => r.externalId ?? r.listingId);
    }
  }
  return Array.from(demoFavorites.get(userId) ?? []);
}

export async function listFavoriteListings(userId: string): Promise<ListingWithLocation[]> {
  const ids = await listFavoriteIds(userId);
  const items: ListingWithLocation[] = [];
  for (const id of ids) {
    const listing = await getListingById(id);
    if (listing) items.push(listing);
  }
  return items;
}

export async function isFavorite(userId: string, listingId: string): Promise<boolean> {
  const ids = await listFavoriteIds(userId);
  return ids.includes(listingId);
}

export async function addFavorite(userId: string, listingId: string): Promise<boolean> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const [row] = await db
        .select({ id: listings.id })
        .from(listings)
        .where(or(eq(listings.externalId, listingId), eq(listings.id, listingId))!)
        .limit(1);
      if (!row) return false;
      await db.insert(favorites).values({ userId, listingId: row.id });
      return true;
    }
  }
  if (!DEMO_LISTINGS.some((l) => l.id === listingId)) return false;
  const set = demoFavorites.get(userId) ?? new Set<string>();
  set.add(listingId);
  demoFavorites.set(userId, set);
  return true;
}

export async function removeFavorite(userId: string, listingId: string): Promise<boolean> {
  if (useDatabase()) {
    const db = getDb();
    if (db) {
      const rows = await db
        .select({ favId: favorites.id })
        .from(favorites)
        .innerJoin(listings, eq(favorites.listingId, listings.id))
        .where(and(eq(favorites.userId, userId), or(eq(listings.externalId, listingId), eq(listings.id, listingId))!));
      if (rows[0]) {
        await db.delete(favorites).where(eq(favorites.id, rows[0].favId));
      }
      return true;
    }
  }
  const set = demoFavorites.get(userId);
  if (!set) return false;
  set.delete(listingId);
  return true;
}

export async function toggleFavorite(userId: string, listingId: string): Promise<boolean> {
  const active = await isFavorite(userId, listingId);
  if (active) {
    await removeFavorite(userId, listingId);
    return false;
  }
  await addFavorite(userId, listingId);
  return true;
}
