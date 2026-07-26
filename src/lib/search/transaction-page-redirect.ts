/** Construit la query string en préservant les filtres utiles. */
export function buildSearchQuery(
  sp: Record<string, string | string[] | undefined>,
  transactionType: "sale" | "long_term_rent",
): string {
  const params = new URLSearchParams();
  params.set("transactionType", transactionType);
  for (const key of [
    "region",
    "city",
    "neighborhood",
    "listingType",
    "minPrice",
    "maxPrice",
    "minArea",
    "maxArea",
    "bedrooms",
    "query",
    "source",
  ] as const) {
    const value = sp[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  return params.toString();
}

export function mismatchedTransactionRedirect(
  page: "sale" | "long_term_rent",
  sp: Record<string, string | string[] | undefined>,
  locale: string,
): string | null {
  const raw = typeof sp.transactionType === "string" ? sp.transactionType : undefined;
  if (!raw) return null;

  if (page === "sale" && (raw === "long_term_rent" || raw === "short_term_rent")) {
    return `/${locale}/louer?${buildSearchQuery(sp, "long_term_rent")}`;
  }
  if (page === "long_term_rent" && raw === "sale") {
    return `/${locale}/acheter?${buildSearchQuery(sp, "sale")}`;
  }
  return null;
}
