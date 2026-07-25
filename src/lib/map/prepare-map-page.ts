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

const POI_BUDGET_MS = Number(process.env.MAP_POI_BUDGET_MS ?? "1500");

function emptyPois(): MapPageData["nearbyPoisByKey"] {
  return {};
}

/** Prépare données carte côté serveur (coords + POI optionnels, non-bloquants). */
export async function prepareMapPageData(listings: ListingWithLocation[]): Promise<MapPageData> {
  const points = prepareMapListings(listings);

  let poisMap = new Map<string, Awaited<ReturnType<typeof getNearbyPoisForListings>> extends Map<string, infer V> ? V : never>();

  try {
    poisMap = await Promise.race([
      getNearbyPoisForListings(
        points.map((p) => ({
          mapLatitude: p.mapLatitude,
          mapLongitude: p.mapLongitude,
          coordinateSource: p.coordinateSource,
        })),
      ),
      new Promise<typeof poisMap>((resolve) =>
        setTimeout(() => resolve(new Map()), POI_BUDGET_MS),
      ),
    ]);
  } catch {
    poisMap = new Map();
  }

  const nearbyPoisByKey: MapPageData["nearbyPoisByKey"] = emptyPois();
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
