import type { SearchFilters } from "@/modules/search/natural-language-parser";

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

const TRANSACTION_TYPES = new Set(["sale", "long_term_rent", "seasonal_rent"]);

/** Lit les query params recherche de façon sûre (string | string[]). */
export function parseListingSearchParams(
  sp: Record<string, string | string[] | undefined>,
  defaults: { transactionType?: SearchFilters["transactionType"] } = {},
): SearchFilters {
  const rawTx = firstString(sp.transactionType);
  const transactionType = (
    rawTx && TRANSACTION_TYPES.has(rawTx)
      ? rawTx
      : defaults.transactionType
  ) as SearchFilters["transactionType"] | undefined;

  const minPrice = firstString(sp.minPrice);
  const maxPrice = firstString(sp.maxPrice);
  const bedrooms = firstString(sp.bedrooms);

  return {
    transactionType,
    region: firstString(sp.region),
    city: firstString(sp.city),
    neighborhood: firstString(sp.neighborhood),
    listingType: firstString(sp.listingType) as SearchFilters["listingType"],
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    bedrooms: bedrooms ? Number(bedrooms) : undefined,
    hasPool: firstString(sp.hasPool) === "true" ? true : undefined,
    isVerified: firstString(sp.isVerified) === "true" ? true : undefined,
    source: firstString(sp.source) as SearchFilters["source"],
    sort: (firstString(sp.sort) as SearchFilters["sort"]) ?? "recent",
  };
}
