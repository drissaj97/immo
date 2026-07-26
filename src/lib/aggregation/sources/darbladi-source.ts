import { listPublishedDarbladiListings } from "@/lib/data/darbladi-first-party";
import type { AggregatedListing } from "../types";

/** Annonces first-party DarBladi (dépôt manuel / seed). */
export function fetchDarbladiListings(): AggregatedListing[] {
  return listPublishedDarbladiListings();
}
