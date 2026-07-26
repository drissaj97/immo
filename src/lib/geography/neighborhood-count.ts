import { getGeographyIndex } from "@/lib/geography/index";
import { normalizeLocationKey } from "@/lib/search/location-match";

/** Nombre d'annonces indexées pour un couple ville/quartier (dropdown). */
export function getNeighborhoodListingCount(city: string, neighborhood: string): number | null {
  const index = getGeographyIndex();
  if (!index) return null;

  const cityKey = normalizeLocationKey(city);
  const hoodKey = normalizeLocationKey(neighborhood);
  const cityEntry = index.cities.find((c) => normalizeLocationKey(c.name) === cityKey);
  if (!cityEntry) return null;

  const hoodEntry = cityEntry.neighborhoods.find((n) => normalizeLocationKey(n.name) === hoodKey);
  return hoodEntry?.count ?? null;
}
