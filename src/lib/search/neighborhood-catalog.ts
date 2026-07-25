import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import type { SemsaraiProperty } from "@/lib/semsarai/types";
import { normalizeLocationKey } from "@/lib/search/location-match";
import { slugify } from "@/lib/geography/slug";

const CACHE_DIR = path.join(process.cwd(), "data/cache/neighborhood-catalog");

type CityCatalogFile = {
  builtAt: string;
  city: string;
  neighborhoods: Record<string, SemsaraiProperty[]>;
};

const cityCache = new Map<string, CityCatalogFile | null>();

function loadCityCatalog(city: string): CityCatalogFile | null {
  const slug = slugify(city);
  if (cityCache.has(slug)) return cityCache.get(slug) ?? null;

  const filePath = path.join(CACHE_DIR, `${slug}.json`);
  if (!existsSync(filePath)) {
    cityCache.set(slug, null);
    return null;
  }

  try {
    const data = JSON.parse(readFileSync(filePath, "utf-8")) as CityCatalogFile;
    cityCache.set(slug, data);
    return data;
  } catch {
    cityCache.set(slug, null);
    return null;
  }
}

/** Annonces API indexées pour un quartier (construit par geography:build). */
export function loadNeighborhoodCatalog(city: string, neighborhood: string): SemsaraiProperty[] {
  const catalog = loadCityCatalog(city);
  if (!catalog) return [];

  const hoodKey = normalizeLocationKey(neighborhood);
  for (const [name, listings] of Object.entries(catalog.neighborhoods)) {
    if (normalizeLocationKey(name) === hoodKey) return listings;
  }
  return [];
}

export function hasNeighborhoodCatalog(city: string): boolean {
  return existsSync(path.join(CACHE_DIR, `${slugify(city)}.json`));
}

export function listNeighborhoodCatalogCities(): string[] {
  if (!existsSync(CACHE_DIR)) return [];
  return readdirSync(CACHE_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function resetNeighborhoodCatalogCache(): void {
  cityCache.clear();
}

export { CACHE_DIR as NEIGHBORHOOD_CATALOG_DIR };
