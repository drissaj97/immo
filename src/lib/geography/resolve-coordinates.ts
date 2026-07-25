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
  "sale|salaeljadida": { lat: 34.002, lng: -6.733 },
  "marrakech|gueliz": { lat: 31.634, lng: -8.007 },
};

let lookupMap: Map<string, CoordinateEntry> | null = null;

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

  return entries;
}

function buildLookup(): Map<string, CoordinateEntry> {
  if (lookupMap) return lookupMap;

  lookupMap = new Map();
  for (const entry of loadEntries()) {
    const cityKey = normalizeLocationKey(entry.city);
    if (entry.neighborhood) {
      lookupMap.set(`${cityKey}|${normalizeLocationKey(entry.neighborhood)}`, entry);
    }
    if (!lookupMap.has(cityKey)) {
      lookupMap.set(cityKey, entry);
    }
  }
  return lookupMap;
}

export function isPlaceholderCoordinate(lat?: number, lng?: number): boolean {
  if (lat == null || lng == null) return true;
  return Math.abs(lat - PLACEHOLDER_LAT) < 0.001 && Math.abs(lng - PLACEHOLDER_LNG) < 0.001;
}

export function resolveListingCoordinates(input: {
  city: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
}): ResolvedCoordinates {
  if (!isPlaceholderCoordinate(input.latitude, input.longitude) && input.latitude != null && input.longitude != null) {
    return { latitude: input.latitude, longitude: input.longitude, source: "exact" };
  }

  const lookup = buildLookup();
  const cityKey = normalizeLocationKey(input.city);
  const hoodKey = input.neighborhood ? normalizeLocationKey(input.neighborhood) : "";

  if (hoodKey) {
    const exact = lookup.get(`${cityKey}|${hoodKey}`);
    if (exact) {
      return { latitude: exact.latitude, longitude: exact.longitude, source: "neighborhood" };
    }

    for (const [key, entry] of lookup.entries()) {
      if (!key.startsWith(`${cityKey}|`)) continue;
      const entryHood = key.split("|")[1] ?? "";
      if (entryHood.includes(hoodKey) || hoodKey.includes(entryHood)) {
        return { latitude: entry.latitude, longitude: entry.longitude, source: "neighborhood" };
      }
    }

    const hardHood =
      NEIGHBORHOOD_CENTROIDS[`${cityKey}|${hoodKey}`] ??
      NEIGHBORHOOD_CENTROIDS[`${cityKey.replace(/\s/g, "")}|${hoodKey.replace(/\s/g, "")}`];
    if (hardHood) {
      return { latitude: hardHood.lat, longitude: hardHood.lng, source: "neighborhood" };
    }
  }

  const cityEntry = lookup.get(cityKey);
  if (cityEntry) {
    return { latitude: cityEntry.latitude, longitude: cityEntry.longitude, source: "city" };
  }

  const centroid = CITY_CENTROIDS[cityKey.replace(/\s/g, "")] ?? CITY_CENTROIDS[cityKey];
  if (centroid) {
    return { latitude: centroid.lat, longitude: centroid.lng, source: "city" };
  }

  return { latitude: PLACEHOLDER_LAT, longitude: PLACEHOLDER_LNG, source: "unknown" };
}
