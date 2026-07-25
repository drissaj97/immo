import type { ListingWithLocation } from "@/server/repositories/listings";
import { prepareMapListings } from "@/lib/map/prepare-map-listings";
import type { MapListingPoint } from "@/lib/map/listing-map-points";
import { getNearbyPoisForListings } from "@/lib/map/nearby-pois";

export type MapPageData = {
  points: MapListingPoint[];
  nearbyPoisByKey: Record<string, Array<{ name: string; category: string; distanceM: number }>>;
  mapCount: number;
  listings: ListingWithLocation[];
};

/** Prépare données carte côté serveur (coords + POI quartier). */
export async function prepareMapPageData(listings: ListingWithLocation[]): Promise<MapPageData> {
  const points = prepareMapListings(listings);
  const poisMap = await getNearbyPoisForListings(
    points.map((p) => ({
      mapLatitude: p.mapLatitude,
      mapLongitude: p.mapLongitude,
      coordinateSource: p.coordinateSource,
    })),
  );

  const nearbyPoisByKey: MapPageData["nearbyPoisByKey"] = {};
  for (const [key, pois] of poisMap.entries()) {
    nearbyPoisByKey[key] = pois.map((p) => ({
      name: p.name,
      category: p.category,
      distanceM: p.distanceM,
    }));
  }

  return {
    points,
    nearbyPoisByKey,
    mapCount: points.length,
    listings,
  };
}
