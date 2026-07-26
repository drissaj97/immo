#!/usr/bin/env tsx
/**
 * Scan API et génère le cache quartier pour une ville (dev / ciblé).
 * Usage: pnpm exec tsx scripts/build-city-neighborhood-catalog.ts Bouskoura
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fetchSemsaraiProperties } from "../src/lib/semsarai/client";
import type { SemsaraiProperty } from "../src/lib/semsarai/types";
import { slugify } from "../src/lib/geography/slug";
import { normalizeLocationKey } from "../src/lib/search/location-match";
import { NEIGHBORHOOD_CATALOG_DIR } from "../src/lib/search/neighborhood-catalog";

const PAGE_SIZE = Number(process.env.SEMSARAI_PAGE_SIZE ?? "100");
const CONCURRENCY = Number(process.env.SEMSARAI_SCAN_CONCURRENCY ?? "8");
const TARGET_CITY = process.argv[2] ?? "Bouskoura";
const targetKey = normalizeLocationKey(TARGET_CITY);

function compactProperty(p: SemsaraiProperty): SemsaraiProperty {
  return {
    id: p.id,
    title: p.title,
    description: p.description?.slice(0, 280) ?? p.title,
    price: p.price,
    surface: p.surface,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    cityName: p.cityName,
    quartier: p.quartier,
    propertyTypeName: p.propertyTypeName,
    sell: p.sell,
    longTerm: p.longTerm,
    images: p.images?.slice(0, 3),
    link: p.link,
    site: p.site,
    createdAt: p.createdAt,
    features: p.features?.slice(0, 5),
  };
}

async function main() {
  console.info(`[city-catalog] Scan ${TARGET_CITY}…`);
  const seen = new Set<string>();
  const neighborhoods = new Map<string, Map<string, SemsaraiProperty[]>>();

  function ingest(p: SemsaraiProperty) {
    const city = p.cityName?.trim();
    if (!city || seen.has(p.id)) return;
    if (normalizeLocationKey(city) !== targetKey) return;
    seen.add(p.id);

    const hood = p.quartier?.trim() || city;
    const hoodKey = normalizeLocationKey(hood);
    const hoodMap = neighborhoods.get(hoodKey) ?? new Map<string, SemsaraiProperty[]>();
    const nameMap = hoodMap;
    const list = nameMap.get(hood) ?? [];
    list.push(compactProperty(p));
    nameMap.set(hood, list);
    neighborhoods.set(hoodKey, nameMap);
  }

  const first = await fetchSemsaraiProperties({ page: 1, limit: PAGE_SIZE });
  const totalPages = first.totalPages ?? Math.ceil(first.totalCount / PAGE_SIZE);
  first.properties.forEach(ingest);

  let nextPage = 2;
  let emptyStreak = 0;

  async function worker() {
    while (true) {
      const page = nextPage++;
      if (page > totalPages || emptyStreak >= CONCURRENCY) return;
      try {
        const batch = await fetchSemsaraiProperties({ page, limit: PAGE_SIZE });
        if (!batch.properties.length) {
          emptyStreak += 1;
          continue;
        }
        emptyStreak = 0;
        batch.properties.forEach(ingest);
        if (page % 50 === 0) console.info(`[city-catalog] page ${page}/${totalPages} — ${seen.size} annonces`);
      } catch {
        emptyStreak += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const hoodEntries: Record<string, SemsaraiProperty[]> = {};
  for (const hoodMap of neighborhoods.values()) {
    for (const [name, listings] of hoodMap.entries()) {
      hoodEntries[name] = listings;
    }
  }

  mkdirSync(NEIGHBORHOOD_CATALOG_DIR, { recursive: true });
  const outPath = path.join(NEIGHBORHOOD_CATALOG_DIR, `${slugify(TARGET_CITY)}.json`);
  writeFileSync(
    outPath,
    JSON.stringify({ builtAt: new Date().toISOString(), city: TARGET_CITY, neighborhoods: hoodEntries }),
  );

  const victoria = hoodEntries["Victoria"]?.length ?? 0;
  console.info(`✓ ${seen.size} annonces — Victoria: ${victoria} → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
