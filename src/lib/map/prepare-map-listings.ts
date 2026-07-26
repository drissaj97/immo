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
      mapLatitude: resolved.latitude,
      mapLongitude: resolved.longitude,
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

  // Écarter les pins superposés (sinon 9 annonces = 1 pastille visible).
  return spiderfyStackedPoints(points);
}

/** Répartit en cercle les annonces qui partagent quasiment les mêmes coords. */
export function spiderfyStackedPoints(points: MapListingPoint[]): MapListingPoint[] {
  if (points.length <= 1) return points;

  const groups = new Map<string, number[]>();
  points.forEach((point, idx) => {
    const key = `${point.mapLatitude.toFixed(4)}|${point.mapLongitude.toFixed(4)}`;
    const arr = groups.get(key) ?? [];
    arr.push(idx);
    groups.set(key, arr);
  });

  const out = points.map((p) => ({ ...p }));
  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    const base = out[indices[0]!]!;
    const n = indices.length;
    // ~80–180 m de rayon selon le nombre — lisible au zoom quartier
    const radius = 0.0009 + 0.00025 * Math.min(n, 12);
    indices.forEach((pointIdx, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const point = out[pointIdx]!;
      point.mapLatitude = base.mapLatitude + Math.cos(angle) * radius;
      point.mapLongitude = base.mapLongitude + Math.sin(angle) * radius;
      if (point.coordinateSource === "exact") {
        point.coordinateSource = "neighborhood";
      }
    });
  }
  return out;
}
