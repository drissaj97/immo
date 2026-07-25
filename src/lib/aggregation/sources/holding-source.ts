import { HOLDING_LISTINGS } from "@/lib/data/holding-listings";
import type { AggregatedListing } from "../types";
import { normalizeHoldingListing } from "../normalizer";

export function fetchHoldingListings(): AggregatedListing[] {
  return HOLDING_LISTINGS.map(normalizeHoldingListing);
}
