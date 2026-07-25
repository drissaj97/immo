import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { resolveMoroccoRegion } from "@/lib/geography/morocco-regions";

/** Recherche autorisée uniquement avec région + ville + quartier. */
export function hasCompleteLocation(filters: SearchFilters): boolean {
  return Boolean(filters.region?.trim() && filters.city?.trim() && filters.neighborhood?.trim());
}

/** Complète la région à partir de la ville si absente. */
export function enrichSearchFilters(filters: SearchFilters): SearchFilters {
  const city = filters.city?.trim();
  const region =
    filters.region?.trim() ||
    (city ? String(resolveMoroccoRegion(city, filters.region)) : undefined);

  return {
    ...filters,
    region,
    city,
    neighborhood: filters.neighborhood?.trim() || undefined,
  };
}

export function locationGateMessage(): string {
  return "Choisissez une région, une ville et un quartier — ou cliquez un raccourci ci-dessous.";
}
