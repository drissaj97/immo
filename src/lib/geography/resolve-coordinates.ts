import { readFileSync, existsSync } from "fs";
import path from "path";
import { DEMO_LOCATIONS } from "@/lib/data/demo-data";
import { normalizeLocationKey } from "@/lib/search/location-match";

export type CoordinateSource = "exact" | "neighborhood" | "city" | "unknown";

export type ResolvedCoordinates = {
  latitude: number;
  longitude: number;
  source: CoordinateSource;
};

type CoordinateEntry = {
  city: string;
  neighborhood?: string;
  latitude: number;
  longitude: number;
};

const PLACEHOLDER_LAT = 33.5;
const PLACEHOLDER_LNG = -7.5;

/** Emprise approximative du Maroc (métropole + Sahara) — hors Null Island / océan. */
const MOROCCO_BOUNDS = {
  minLat: 20.5,
  maxLat: 36.2,
  minLng: -17.5,
  maxLng: -0.8,
};

const CITY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  casablanca: { lat: 33.5731, lng: -7.5898 },
  rabat: { lat: 34.0209, lng: -6.8416 },
  sale: { lat: 34.0333, lng: -6.7983 },
  marrakech: { lat: 31.6295, lng: -7.9811 },
  tanger: { lat: 35.7595, lng: -5.834 },
  agadir: { lat: 30.4278, lng: -9.5981 },
  fes: { lat: 34.0181, lng: -5.0078 },
  kenitra: { lat: 34.261, lng: -6.582 },
  mohammedia: { lat: 33.686, lng: -7.383 },
  temara: { lat: 33.928, lng: -6.906 },
  bouznika: { lat: 33.789, lng: -7.159 },
  bouskoura: { lat: 33.4486, lng: -7.6508 },
  darbouazza: { lat: 33.521, lng: -7.822 },
  nador: { lat: 35.168, lng: -2.933 },
  oujda: { lat: 34.687, lng: -1.911 },
  meknes: { lat: 33.895, lng: -5.554 },
  eljadida: { lat: 33.231, lng: -8.5 },
  essaouira: { lat: 31.508, lng: -9.77 },
  tetouan: { lat: 35.588, lng: -5.368 },
};

/** Quartiers fréquents absents du cache OSM — évitent une carte vide. */
const NEIGHBORHOOD_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  "bouskoura|victoria": { lat: 33.4565, lng: -7.6422 },
  "bouskoura|villeverte": { lat: 33.439, lng: -7.665 },
  "bouskoura|bouskouraville": { lat: 33.4486, lng: -7.6508 },
  "casablanca|maarif": { lat: 33.5845, lng: -7.635 },
  "casablanca|anfa": { lat: 33.588, lng: -7.662 },
  "casablanca|californie": { lat: 33.546, lng: -7.64 },
  "rabat|hayriad": { lat: 33.956, lng: -6.87 },
  "sale|salaeljadida": { lat: 34.045, lng: -6.812 },
  "marrakech|gueliz": { lat: 31.634, lng: -8.007 },
  "temara|wifak": { lat: 33.912, lng: -6.918 },
  "temara|alwifak": { lat: 33.912, lng: -6.918 },
  "temara|temaraplage": { lat: 33.931, lng: -6.954 },
};

let lookupMap: Map<string, CoordinateEntry> | null = null;

/** Coordonnées exploitables sur une carte Maroc (pas 0,0 / océan / NaN). */
export function isValidMoroccoCoordinate(
  lat?: number | null,
  lng?: number | null,
): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.05 && Math.abs(lng) < 0.05) return false;
  return (
    lat >= MOROCCO_BOUNDS.minLat &&
    lat <= MOROCCO_BOUNDS.maxLat &&
    lng >= MOROCCO_BOUNDS.minLng &&
    lng <= MOROCCO_BOUNDS.maxLng
  );
}

export function isPlaceholderCoordinate(lat?: number, lng?: number): boolean {
  if (lat == null || lng == null) return true;
  if (!isValidMoroccoCoordinate(lat, lng)) return true;
  return Math.abs(lat - PLACEHOLDER_LAT) < 0.001 && Math.abs(lng - PLACEHOLDER_LNG) < 0.001;
}

function loadEntries(): CoordinateEntry[] {
  const entries: CoordinateEntry[] = DEMO_LOCATIONS.map((loc) => ({
    city: loc.city,
    neighborhood: loc.neighborhood,
    latitude: loc.latitude,
    longitude: loc.longitude,
  }));

  const filePath = path.join(process.cwd(), "data/cache/morocco-coordinates.json");
  if (existsSync(filePath)) {
    try {
      const file = JSON.parse(readFileSync(filePath, "utf-8")) as { entries?: CoordinateEntry[] };
      entries.push(...(file.entries ?? []));
    } catch {
      /* ignore */
    }
  }

  return entries.filter((e) => isValidMoroccoCoordinate(e.latitude, e.longitude));
}

function buildLookup(): Map<string, CoordinateEntry> {
  if (lookupMap) return lookupMap;

  lookupMap = new Map();
  for (const entry of loadEntries()) {
    const cityKey = normalizeLocationKey(entry.city);
    if (entry.neighborhood) {
      const hoodKey = `${cityKey}|${normalizeLocationKey(entry.neighborhood)}`;
      // Ne pas écraser une entrée déjà valide (DEMO prioritaire sur cache).
      if (!lookupMap.has(hoodKey)) {
        lookupMap.set(hoodKey, entry);
      }
    }
    if (!lookupMap.has(cityKey)) {
      lookupMap.set(cityKey, entry);
    }
  }
  return lookupMap;
}

/** Distance approximative en km (Haversine légère). */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Centroïde ville connu (ou null). */
export function getCityCentroid(city: string): { lat: number; lng: number } | null {
  const cityKey = normalizeLocationKey(city).replace(/\s/g, "");
  const c = CITY_CENTROIDS[cityKey] ?? CITY_CENTROIDS[normalizeLocationKey(city)];
  return c ? { lat: c.lat, lng: c.lng } : null;
}

/** Coords « exactes » acceptables pour une ville (pas océan / pas 2000 km plus loin). */
export function isReasonableCoordinateForCity(
  lat: number | null | undefined,
  lng: number | null | undefined,
  city: string,
  maxKm = 75,
): boolean {
  if (!isValidMoroccoCoordinate(lat, lng)) return false;
  if (isPlaceholderCoordinate(lat, lng)) return false;
  const centroid = getCityCentroid(city);
  if (!centroid) return true;
  return distanceKm(centroid, { lat: lat as number, lng: lng as number }) <= maxKm;
}

export function resolveListingCoordinates(input: {
  city: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}): ResolvedCoordinates {
  let lat = input.latitude;
  let lng = input.longitude;

  // Lat/lng parfois inversés par les flux partenaires → corriger si le swap est au Maroc.
  if (
    !isValidMoroccoCoordinate(lat, lng) &&
    isValidMoroccoCoordinate(lng, lat)
  ) {
    lat = input.longitude;
    lng = input.latitude;
  }

  if (
    isReasonableCoordinateForCity(lat, lng, input.city) &&
    !isPlaceholderCoordinate(lat, lng)
  ) {
    return {
      latitude: lat as number,
      longitude: lng as number,
      source: "exact",
    };
  }

  const lookup = buildLookup();
  const cityKey = normalizeLocationKey(input.city);
  const hoodKey = input.neighborhood ? normalizeLocationKey(input.neighborhood) : "";
  // Quartier générique = nom de ville → ignorer pour viser un vrai quartier / centroïde ville.
  const genericHood = !hoodKey || hoodKey === cityKey;

  if (hoodKey && !genericHood) {
    const exact = lookup.get(`${cityKey}|${hoodKey}`);
    if (exact && isValidMoroccoCoordinate(exact.latitude, exact.longitude)) {
      return { latitude: exact.latitude, longitude: exact.longitude, source: "neighborhood" };
    }

    for (const [key, entry] of lookup.entries()) {
      if (!key.startsWith(`${cityKey}|`)) continue;
      if (!isValidMoroccoCoordinate(entry.latitude, entry.longitude)) continue;
      const entryHood = key.split("|")[1] ?? "";
      if (entryHood.includes(hoodKey) || hoodKey.includes(entryHood)) {
        return { latitude: entry.latitude, longitude: entry.longitude, source: "neighborhood" };
      }
    }

    const hardHood =
      NEIGHBORHOOD_CENTROIDS[`${cityKey}|${hoodKey}`] ??
      NEIGHBORHOOD_CENTROIDS[`${cityKey.replace(/\s/g, "")}|${hoodKey.replace(/\s/g, "")}`];
    if (hardHood && isValidMoroccoCoordinate(hardHood.lat, hardHood.lng)) {
      return { latitude: hardHood.lat, longitude: hardHood.lng, source: "neighborhood" };
    }
  }

  const cityEntry = lookup.get(cityKey);
  if (cityEntry && isValidMoroccoCoordinate(cityEntry.latitude, cityEntry.longitude)) {
    return { latitude: cityEntry.latitude, longitude: cityEntry.longitude, source: "city" };
  }

  const centroid = CITY_CENTROIDS[cityKey.replace(/\s/g, "")] ?? CITY_CENTROIDS[cityKey];
  if (centroid && isValidMoroccoCoordinate(centroid.lat, centroid.lng)) {
    return { latitude: centroid.lat, longitude: centroid.lng, source: "city" };
  }

  return { latitude: PLACEHOLDER_LAT, longitude: PLACEHOLDER_LNG, source: "unknown" };
}
