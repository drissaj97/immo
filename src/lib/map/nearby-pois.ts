export type NearbyPoi = {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distanceM: number;
};

const POI_CACHE = new Map<string, { expiresAt: number; pois: NearbyPoi[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const FETCH_TIMEOUT_MS = Number(process.env.OVERPASS_TIMEOUT_MS ?? "2500");

const CATEGORY_LABELS: Record<string, string> = {
  supermarket: "Supermarché",
  convenience: "Épicerie",
  mall: "Centre commercial",
  pharmacy: "Pharmacie",
  school: "École",
  mosque: "Mosquée",
  restaurant: "Restaurant",
  cafe: "Café",
  bank: "Banque",
  hospital: "Hôpital",
};

/** POI à proximité via Overpass OSM (timeout court, cache 24h). */
export async function getNearbyPois(
  latitude: number,
  longitude: number,
  radiusM = 700,
): Promise<NearbyPoi[]> {
  const cacheKey = `${latitude.toFixed(3)}|${longitude.toFixed(3)}|${radiusM}`;
  const cached = POI_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.pois;
  }

  const query = `
    [out:json][timeout:2];
    (
      node["amenity"~"supermarket|pharmacy|school|restaurant|cafe|bank|hospital|place_of_worship"](around:${radiusM},${latitude},${longitude});
      node["shop"~"supermarket|convenience|mall"](around:${radiusM},${latitude},${longitude});
    );
    out body 20;
  `;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
      next: { revalidate: 86400 },
    }).finally(() => clearTimeout(timer));

    if (!res.ok) return [];

    const data = (await res.json()) as {
      elements?: Array<{
        lat?: number;
        lon?: number;
        tags?: { name?: string; amenity?: string; shop?: string };
      }>;
    };

    const pois: NearbyPoi[] = (data.elements ?? [])
      .filter((el) => el.lat != null && el.lon != null && el.tags?.name)
      .map((el) => {
        const category = el.tags?.amenity ?? el.tags?.shop ?? "place";
        const distanceM = haversineM(latitude, longitude, el.lat!, el.lon!);
        return {
          name: el.tags!.name!,
          category: CATEGORY_LABELS[category] ?? category,
          latitude: el.lat!,
          longitude: el.lon!,
          distanceM: Math.round(distanceM),
        };
      })
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, 6);

    POI_CACHE.set(cacheKey, { pois, expiresAt: Date.now() + CACHE_TTL_MS });
    return pois;
  } catch {
    POI_CACHE.set(cacheKey, { pois: [], expiresAt: Date.now() + 5 * 60 * 1000 });
    return [];
  }
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Une seule requête POI autour du centre du quartier (évite N appels Overpass). */
export async function getNearbyPoisForListings(
  listings: Array<{ mapLatitude: number; mapLongitude: number; coordinateSource: string }>,
): Promise<Map<string, NearbyPoi[]>> {
  const result = new Map<string, NearbyPoi[]>();
  if (!listings.length) return result;

  const approx = listings.filter((l) => l.coordinateSource !== "exact");
  const sample = approx.length ? approx : listings.slice(0, 1);
  const lat = sample.reduce((s, l) => s + l.mapLatitude, 0) / sample.length;
  const lng = sample.reduce((s, l) => s + l.mapLongitude, 0) / sample.length;

  const pois = await getNearbyPois(lat, lng, 900);
  const key = `${lat.toFixed(3)}|${lng.toFixed(3)}`;

  for (const listing of listings) {
    const listingKey = `${listing.mapLatitude.toFixed(3)}|${listing.mapLongitude.toFixed(3)}`;
    result.set(listingKey, pois);
  }
  if (!result.has(key)) result.set(key, pois);

  return result;
}
