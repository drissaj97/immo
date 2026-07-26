import type { SearchFilters } from "@/modules/search/natural-language-parser";

/** Libellé lisible pour une recherche sauvegardée / alerte. */
export function buildSavedSearchName(filters: SearchFilters): string {
  const tx =
    filters.transactionType === "long_term_rent" || filters.transactionType === "short_term_rent"
      ? "Louer"
      : "Acheter";
  const place = [filters.neighborhood, filters.city].filter(Boolean).join(", ");
  const type = filters.listingType && filters.listingType !== "apartment" ? filters.listingType : "";
  const parts = [tx, place || filters.region || "Maroc", type].filter(Boolean);
  return parts.join(" · ");
}

export function filtersToSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.transactionType) params.set("transactionType", filters.transactionType);
  if (filters.region) params.set("region", filters.region);
  if (filters.city) params.set("city", filters.city);
  if (filters.neighborhood) params.set("neighborhood", filters.neighborhood);
  if (filters.listingType) params.set("listingType", filters.listingType);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.bedrooms != null) params.set("bedrooms", String(filters.bedrooms));
  return params;
}

export function resultsPathForFilters(locale: string, filters: SearchFilters): string {
  const base =
    filters.transactionType === "long_term_rent" || filters.transactionType === "short_term_rent"
      ? `/${locale}/louer`
      : `/${locale}/acheter`;
  const qs = filtersToSearchParams(filters).toString();
  return qs ? `${base}?${qs}` : base;
}

export function formatFiltersSummary(filters: SearchFilters): string {
  const bits: string[] = [];
  if (filters.region) bits.push(filters.region);
  if (filters.city) bits.push(filters.city);
  if (filters.neighborhood) bits.push(filters.neighborhood);
  if (filters.listingType) bits.push(filters.listingType);
  if (filters.minPrice != null || filters.maxPrice != null) {
    const min = filters.minPrice != null ? `${filters.minPrice.toLocaleString("fr-MA")}` : "—";
    const max = filters.maxPrice != null ? `${filters.maxPrice.toLocaleString("fr-MA")}` : "—";
    bits.push(`${min} – ${max} MAD`);
  }
  return bits.join(" · ") || "Tous critères";
}
