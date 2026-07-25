import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import type { CityIndex, MoroccoGeographyIndex, RegionIndex } from "./types";
import { slugify } from "./slug";
import { resolveMoroccoRegion } from "./morocco-regions";

const CACHE_PATH = path.join(process.cwd(), "data/cache/morocco-geography.json");

let memoryCache: MoroccoGeographyIndex | null = null;

export function getGeographyIndex(): MoroccoGeographyIndex | null {
  if (memoryCache) return memoryCache;
  if (!existsSync(CACHE_PATH)) return null;
  try {
    memoryCache = JSON.parse(readFileSync(CACHE_PATH, "utf-8")) as MoroccoGeographyIndex;
    return memoryCache;
  } catch {
    return null;
  }
}

export function saveGeographyIndex(index: MoroccoGeographyIndex): void {
  mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(index, null, 2));
  memoryCache = index;
}

export function getAllCities(): CityIndex[] {
  return getGeographyIndex()?.cities ?? [];
}

export function getAllRegions(): RegionIndex[] {
  return getGeographyIndex()?.regions ?? [];
}

export function getCityBySlug(slug: string): CityIndex | undefined {
  return getAllCities().find((c) => c.slug === slug.toLowerCase());
}

export function getRegionBySlug(slug: string): RegionIndex | undefined {
  return getAllRegions().find((r) => r.slug === slug.toLowerCase());
}

export function getCitiesForSelect(): Array<{ city: string; count: number; region: string }> {
  return getAllCities().map((c) => ({ city: c.name, count: c.count, region: c.region }));
}

export function buildFallbackFromListings(
  listings: Array<{ location: { city: string; neighborhood: string; region?: string } }>,
): MoroccoGeographyIndex {
  const cityMap = new Map<
    string,
    { count: number; region: string; neighborhoods: Map<string, number> }
  >();

  for (const l of listings) {
    const city = l.location.city.trim();
    if (!city) continue;
    const region = resolveMoroccoRegion(city, l.location.region?.trim() || undefined);
    const hood = l.location.neighborhood?.trim() || city;
    const entry = cityMap.get(city) ?? { count: 0, region, neighborhoods: new Map() };
    entry.count += 1;
    entry.neighborhoods.set(hood, (entry.neighborhoods.get(hood) ?? 0) + 1);
    cityMap.set(city, entry);
  }

  return finalizeIndex(cityMap, listings.length, listings.length);
}

export function finalizeIndex(
  cityMap: Map<string, { count: number; region: string; neighborhoods: Map<string, number> }>,
  scanned: number,
  apiTotal: number,
): MoroccoGeographyIndex {
  const cities: CityIndex[] = Array.from(cityMap.entries())
    .map(([name, data]) => ({
      name,
      slug: slugify(name),
      count: data.count,
      region: data.region,
      regionSlug: slugify(data.region),
      neighborhoods: Array.from(data.neighborhoods.entries())
        .map(([n, count]) => ({ name: n, count, slug: slugify(n) }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.count - a.count);

  const regionMap = new Map<string, { count: number; cities: Set<string> }>();
  for (const c of cities) {
    const r = regionMap.get(c.region) ?? { count: 0, cities: new Set<string>() };
    r.count += c.count;
    r.cities.add(c.name);
    regionMap.set(c.region, r);
  }

  const regions: RegionIndex[] = Array.from(regionMap.entries())
    .map(([name, data]) => ({
      name,
      slug: slugify(name),
      count: data.count,
      cities: Array.from(data.cities).sort((a, b) => a.localeCompare(b, "fr")),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    builtAt: new Date().toISOString(),
    totalListingsScanned: scanned,
    apiTotalCount: apiTotal,
    cities,
    regions,
  };
}

export { CACHE_PATH };
