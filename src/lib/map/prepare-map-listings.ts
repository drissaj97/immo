import "server-only";

import type { ListingWithLocation } from "@/server/repositories/listings";
import {
  distanceKm,
  isPlaceholderCoordinate,
  isValidMoroccoCoordinate,
  resolveListingCoordinates,
} from "@/lib/geography/resolve-coordinates";
import type { MapListingPoint } from "@/lib/map/listing-map-points";

export type MapListingsOptions = {
  /** Ville recherchée — ancre le filtre géographique. */
  searchCity?: string;
  /** Quartier recherché — ancre le filtre géographique. */
  searchNeighborhood?: string;
  /** Rayon max autour de la zone recherchée (km). Défaut 18. */
  maxDistanceKm?: number;
};

/** Prépare les points carte côté serveur (coords + anti-collision + zone recherche). */
export function prepareMapListings(
  listings: ListingWithLocation[],
  options: MapListingsOptions = {},
): MapListingPoint[] {
  const bucketCount = new Map<string, number>();
  const points: MapListingPoint[] = [];

  const searchCity = options.searchCity?.trim();
  const searchNeighborhood = options.searchNeighborhood?.trim();
  const maxDistanceKm = options.maxDistanceKm ?? 18;

  const searchAnchor =
    searchCity
      ? resolveListingCoordinates({
          city: searchCity,
          neighborhood: searchNeighborhood || undefined,
        })
      : null;
  const hasSearchAnchor =
    searchAnchor != null &&
    searchAnchor.source !== "unknown" &&
    isValidMoroccoCoordinate(searchAnchor.latitude, searchAnchor.longitude);

  for (const listing of listings) {
    const resolved = resolveListingCoordinates({
      city: listing.location.city,
      neighborhood: listing.location.neighborhood,
      latitude: listing.latitude,
      longitude: listing.longitude,
    });
    if (resolved.source === "unknown") continue;
    if (!isValidMoroccoCoordinate(resolved.latitude, resolved.longitude)) continue;

    if (hasSearchAnchor) {
      const km = distanceKm(
        { lat: searchAnchor.latitude, lng: searchAnchor.longitude },
        { lat: resolved.latitude, lng: resolved.longitude },
      );
      if (km > maxDistanceKm) continue;
    }

    const bucketKey = `${resolved.latitude.toFixed(4)}|${resolved.longitude.toFixed(4)}`;
    const index = bucketCount.get(bucketKey) ?? 0;
    bucketCount.set(bucketKey, index + 1);
    const jitter = index > 0 ? spreadOffset(index) : { lat: 0, lng: 0 };

    points.push({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      currency: listing.currency,
      slug: listing.slug,
      city: listing.location.city,
      neighborhood: listing.location.neighborhood,
      mapLatitude: resolved.latitude + jitter.lat,
      mapLongitude: resolved.longitude + jitter.lng,
      coordinateSource: isPlaceholderCoordinate(listing.latitude, listing.longitude)
        ? resolved.source
        : "exact",
    });
  }

  return points;
}

function spreadOffset(index: number): { lat: number; lng: number } {
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.0015 * Math.min(index, 8);
  return {
    lat: Math.cos(angle) * radius,
    lng: Math.sin(angle) * radius,
  };
}
