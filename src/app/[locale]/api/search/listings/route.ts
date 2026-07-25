import { NextResponse } from "next/server";
import { searchListings } from "@/server/repositories/listings";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { LISTINGS_PAGE_SIZE } from "@/lib/search/page-size";
import { hasCompleteLocation } from "@/lib/search/location-gate";

/** Recherche publique paginée pour chargement progressif (10/page). */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  await params;
  const { searchParams } = new URL(request.url);

  const filters: SearchFilters = {
    region: searchParams.get("region") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    neighborhood: searchParams.get("neighborhood") ?? undefined,
    transactionType: (searchParams.get("transactionType") as SearchFilters["transactionType"]) ?? undefined,
    listingType: (searchParams.get("listingType") as SearchFilters["listingType"]) ?? undefined,
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    bedrooms: searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined,
    sort: (searchParams.get("sort") as SearchFilters["sort"]) ?? "recent",
    page: Math.max(1, Number(searchParams.get("page") ?? 1)),
    limit: Math.min(Number(searchParams.get("limit") ?? LISTINGS_PAGE_SIZE), 20),
  };

  if (!hasCompleteLocation(filters)) {
    return NextResponse.json({ items: [], total: 0, page: 1, totalPages: 1 });
  }

  const result = await searchListings(filters);

  return NextResponse.json({
    items: result.items,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}
