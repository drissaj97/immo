import { SEMSARAI_LISTINGS } from "@/lib/data/semsarai-listings";
import { fetchSemsaraiProperties } from "@/lib/semsarai/client";
import { semsaraiPropertyToListing } from "@/lib/semsarai/normalizer";
import type { AggregatedListing } from "../types";
import { normalizeSemsaraiListing } from "@/lib/semsarai/normalizer";

/** Sync live API — opt-in only (évite blocage au démarrage/build). */
const LIVE_SYNC = process.env.SEMSARAI_LIVE_SYNC === "true";
const LIVE_LIMIT = Number(process.env.SEMSARAI_LIVE_LIMIT ?? "1000");
const PAGE_SIZE = Number(process.env.SEMSARAI_PAGE_SIZE ?? "50");

let liveCache: { listings: AggregatedListing[]; fetchedAt: number } | null = null;
const LIVE_TTL_MS = 15 * 60 * 1000;

function staticListings(): AggregatedListing[] {
  return SEMSARAI_LISTINGS.filter((l) => l.status === "published").map(normalizeSemsaraiListing);
}

async function fetchLiveSupplement(): Promise<AggregatedListing[]> {
  const now = Date.now();
  if (liveCache && now - liveCache.fetchedAt < LIVE_TTL_MS) {
    return liveCache.listings;
  }

  const staticIds = new Set(SEMSARAI_LISTINGS.map((l) => l.id));
  const collected = [];
  let page = 1;

  while (collected.length < LIVE_LIMIT) {
    const batch = await fetchSemsaraiProperties({
      page,
      limit: Math.min(PAGE_SIZE, LIVE_LIMIT - collected.length),
    });
    if (!batch.properties.length) break;

    for (const property of batch.properties) {
      const listing = semsaraiPropertyToListing(property);
      if (!staticIds.has(listing.id)) {
        collected.push(normalizeSemsaraiListing(listing));
      }
    }

    page += 1;
    if (collected.length >= LIVE_LIMIT) break;
  }

  liveCache = { listings: collected, fetchedAt: now };
  return collected;
}

export async function fetchSemsaraiListings(): Promise<AggregatedListing[]> {
  const base = staticListings();

  if (!LIVE_SYNC) return base;

  try {
    const live = await fetchLiveSupplement();
    const seen = new Set(base.map((l) => l.id));
    const merged = [...base];
    for (const item of live) {
      if (!seen.has(item.id)) {
        merged.push(item);
        seen.add(item.id);
      }
    }
    return merged;
  } catch (err) {
    console.warn("[semsarai] Live sync failed, using static import:", err);
    return base;
  }
}

export function resetSemsaraiLiveCache(): void {
  liveCache = null;
}
