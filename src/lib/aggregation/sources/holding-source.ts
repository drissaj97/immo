import { DEMO_LISTINGS } from "@/lib/data/demo-data";
import { HOLDING_LISTINGS } from "@/lib/data/holding-listings";
import type { AggregatedListing } from "../types";
import { normalizeDarbladiListing, normalizeHoldingListing } from "../normalizer";

export function fetchHoldingListings(): AggregatedListing[] {
  return HOLDING_LISTINGS.map(normalizeHoldingListing);
}

export function fetchDarbladiListings(): AggregatedListing[] {
  const holdingIds = new Set(HOLDING_LISTINGS.map((l) => l.id));
  return DEMO_LISTINGS.filter(
    (l) => l.status === "published" && !holdingIds.has(l.id) && !l.id.startsWith("hi-"),
  ).map(normalizeDarbladiListing);
}
