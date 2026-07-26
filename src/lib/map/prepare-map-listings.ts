import "server-only";

import type { ListingWithLocation } from "@/server/repositories/listings";
import {
  distanceKm,
  isReasonableCoordinateForCity,
  isValidMoroccoCoordinate,
  resolveListingCoordinates,
  type CoordinateSource,
} from "@/lib/geography/resolve-coordinates";
import { cityMatches, neighborhoodMatches } from "@/lib/search/location-match";
import type { MapListingPoint } from "@/lib/map/listing-map-points";

export type MapListingsOptions = {
  /** Ville recherchée — ancre le filtre géographique. */
  searchCity?: string;
  /** Quartier recherché — ancre le filtre géographique. */
  searchNeighborhood?: string;
  /** Rayon max autour de la zone recherchée (km). Défaut 10. */
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
  const maxDistanceKm = options.maxDistanceKm ?? 10;

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
    if (searchCity && !cityMatches(searchCity, listing)) continue;
    if (
      searchNeighborhood &&
      !neighborhoodMatches(searchNeighborhood, {
        location: listing.location,
        title: listing.title,
        description: listing.description ?? "",
      })
    ) {
      continue;
    }

    let resolved = resolveListingCoordinates({
      city: listing.location.city,
      neighborhood: listing.location.neighborhood,
      latitude: listing.latitude,
      longitude: listing.longitude,
    });

    const originalWasExact = resolved.source === "exact";

    // Hors Maroc / trop loin de la ville de l'annonce → recentrer sur la ville/quartier
    if (
      resolved.source === "unknown" ||
      !isValidMoroccoCoordinate(resolved.latitude, resolved.longitude) ||
      !isReasonableCoordinateForCity(
        resolved.latitude,
        resolved.longitude,
        listing.location.city,
      )
    ) {
      resolved = resolveListingCoordinates({
        city: listing.location.city,
        neighborhood: listing.location.neighborhood,
      });
    }

    // Annonce de la recherche mais outlier → ramener au centre de la zone cherchée
    if (hasSearchAnchor) {
      const kmFromSearch = distanceKm(
        { lat: searchAnchor.latitude, lng: searchAnchor.longitude },
        { lat: resolved.latitude, lng: resolved.longitude },
      );
      const outside =
        !isValidMoroccoCoordinate(resolved.latitude, resolved.longitude) ||
        resolved.source === "unknown" ||
        kmFromSearch > maxDistanceKm;

      if (outside) {
        resolved = {
          latitude: searchAnchor.latitude,
          longitude: searchAnchor.longitude,
          source: (searchNeighborhood ? "neighborhood" : "city") as CoordinateSource,
        };
      }
    } else if (
      resolved.source === "unknown" ||
      !isValidMoroccoCoordinate(resolved.latitude, resolved.longitude)
    ) {
      continue;
    }

    if (!isValidMoroccoCoordinate(resolved.latitude, resolved.longitude)) continue;
    if (resolved.source === "unknown") continue;

    const bucketKey = `${resolved.latitude.toFixed(4)}|${resolved.longitude.toFixed(4)}`;
    const index = bucketCount.get(bucketKey) ?? 0;
    bucketCount.set(bucketKey, index + 1);
    const jitter = index > 0 ? spreadOffset(index) : { lat: 0, lng: 0 };

    const stillAtOriginalExact =
      originalWasExact &&
      isReasonableCoordinateForCity(
        listing.latitude,
        listing.longitude,
        searchCity || listing.location.city,
      ) &&
      (!hasSearchAnchor ||
        distanceKm(
          { lat: listing.latitude, lng: listing.longitude },
          { lat: searchAnchor.latitude, lng: searchAnchor.longitude },
        ) <= maxDistanceKm);

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
      coordinateSource: stillAtOriginalExact ? "exact" : resolved.source,
    });
  }

  // Filet de sécurité : tout point encore trop loin du centre des pins → ramener
  if (points.length > 1) {
    const centerLat = points.reduce((s, p) => s + p.mapLatitude, 0) / points.length;
    const centerLng = points.reduce((s, p) => s + p.mapLongitude, 0) / points.length;
    const anchor = hasSearchAnchor
      ? { lat: searchAnchor.latitude, lng: searchAnchor.longitude }
      : { lat: centerLat, lng: centerLng };

    for (const point of points) {
      const km = distanceKm(anchor, {
        lat: point.mapLatitude,
        lng: point.mapLongitude,
      });
      if (km <= maxDistanceKm * 2.5 && isValidMoroccoCoordinate(point.mapLatitude, point.mapLongitude)) {
        continue;
      }
      point.mapLatitude = anchor.lat;
      point.mapLongitude = anchor.lng;
      if (point.coordinateSource === "exact") {
        point.coordinateSource = searchNeighborhood ? "neighborhood" : "city";
      }
    }
  }

  return points;
}

function spreadOffset(index: number): { lat: number; lng: number } {
  const angle = (index * 137.5 * Math.PI) / 180;
  const radius = 0.0012 * Math.min(index, 10);
  return {
    lat: Math.cos(angle) * radius,
    lng: Math.sin(angle) * radius,
  };
}
