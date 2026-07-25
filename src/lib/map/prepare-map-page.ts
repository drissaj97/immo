import type { ListingWithLocation } from "@/server/repositories/listings";
import { prepareMapListings } from "@/lib/map/prepare-map-listings";
import type { MapListingPoint } from "@/lib/map/listing-map-points";
import { getNearbyPoisForListings } from "@/lib/map/nearby-pois";
import type { MapPoiPoint } from "@/lib/map/map-poi-types";

export type MapPageData = {
  points: MapListingPoint[];
  nearbyPoisByKey: Record<string, MapPoiPoint[]>;
  nearbyPois: MapPoiPoint[];
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
  const poiSeen = new Set<string>();
  const nearbyPois: MapPoiPoint[] = [];

  for (const [key, pois] of poisMap.entries()) {
    nearbyPoisByKey[key] = pois.map((p) => ({
      name: p.name,
      category: p.category,
      distanceM: p.distanceM,
      latitude: p.latitude,
      longitude: p.longitude,
    }));
    for (const p of pois) {
      const id = `${p.latitude.toFixed(5)}|${p.longitude.toFixed(5)}`;
      if (poiSeen.has(id)) continue;
      poiSeen.add(id);
      nearbyPois.push({
        name: p.name,
        category: p.category,
        distanceM: p.distanceM,
        latitude: p.latitude,
        longitude: p.longitude,
      });
    }
  }

  return {
    points,
    nearbyPoisByKey,
    nearbyPois,
    mapCount: points.length,
    listings,
  };
}
