import { SEMSARAI_LISTINGS } from "@/lib/data/semsarai-listings";
import type { AggregatedListing } from "../types";
import { normalizeSemsaraiListing } from "@/lib/semsarai/normalizer";

export function fetchSemsaraiListings(): AggregatedListing[] {
  return SEMSARAI_LISTINGS.filter((l) => l.status === "published").map(normalizeSemsaraiListing);
}
