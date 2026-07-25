import type { DemoListing } from "@/lib/data/demo-data";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import type { AggregatedListing } from "@/lib/aggregation/types";
import { resolveMoroccoRegion } from "@/lib/geography/morocco-regions";
import { cityMatches, neighborhoodMatches } from "@/lib/search/location-match";

function listingRegion(listing: DemoListing | AggregatedListing): string {
  const city = listing.location.city;
  const hint = listing.location.region ?? city;
  return resolveMoroccoRegion(city, hint);
}

export function listingMatchesFilters(
  listing: DemoListing | AggregatedListing,
  filters: SearchFilters,
): boolean {
  if (filters.transactionType && listing.transactionType !== filters.transactionType) return false;
  if (filters.listingType && listing.listingType !== filters.listingType) return false;
  if (filters.region && listingRegion(listing).toLowerCase() !== filters.region.toLowerCase()) {
    return false;
  }
  if (filters.city && !cityMatches(filters.city, listing.location.city)) return false;
  if (filters.neighborhood && !neighborhoodMatches(filters.neighborhood, listing)) return false;
  if (filters.minPrice && listing.price < filters.minPrice) return false;
  if (filters.maxPrice && listing.price > filters.maxPrice) return false;
  if (filters.minArea && (listing.livingArea ?? 0) < filters.minArea) return false;
  if (filters.maxArea && (listing.livingArea ?? 99999) > filters.maxArea) return false;
  if (filters.bedrooms && (listing.bedrooms ?? 0) < filters.bedrooms) return false;
  if (filters.hasPool && !listing.hasPool) return false;
  if (filters.hasParking && !listing.hasParking) return false;
  if (filters.isVerified && !listing.isVerified) return false;
  if (filters.isNew && !listing.isNew) return false;
  if (filters.source && "aggregationSource" in listing) {
    if ((listing as AggregatedListing).aggregationSource !== filters.source) return false;
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const haystack =
      `${listing.title} ${listing.description} ${listing.location.city} ${listing.location.neighborhood}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

export function hasActiveFilters(filters: SearchFilters): boolean {
  return Boolean(
    filters.transactionType ||
      filters.region ||
      filters.city ||
      filters.neighborhood ||
      filters.listingType ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.minArea ||
      filters.maxArea ||
      filters.bedrooms ||
      filters.hasPool ||
      filters.hasParking ||
      filters.isVerified ||
      filters.isNew ||
      filters.query ||
      filters.source,
  );
}
