#!/usr/bin/env tsx
/**
 * Construit l'index complet villes/régions/quartiers depuis l'API semsarai.ma.
 * Génère aussi le cache quartier par ville (data/cache/neighborhood-catalog/).
 *
 * Usage:
 *   pnpm geography:build
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { getStaticCatalogListings } from "../src/lib/aggregation/catalog";
import { fetchHoldingListings } from "../src/lib/aggregation/sources/holding-source";
import { fetchSemsaraiProperties } from "../src/lib/semsarai/client";
import type { SemsaraiProperty } from "../src/lib/semsarai/types";
import { finalizeIndex, saveGeographyIndex } from "../src/lib/geography/index";
import { resolveMoroccoRegion } from "../src/lib/geography/morocco-regions";
import { slugify } from "../src/lib/geography/slug";
import { normalizeLocationKey } from "../src/lib/search/location-match";
import { NEIGHBORHOOD_CATALOG_DIR } from "../src/lib/search/neighborhood-catalog";

const PAGE_SIZE = Number(process.env.SEMSARAI_PAGE_SIZE ?? "100");
const CONCURRENCY = Number(process.env.GEOGRAPHY_SCAN_CONCURRENCY ?? "5");
const MAX_RETRIES = Number(process.env.GEOGRAPHY_MAX_RETRIES ?? "3");

const CATALOG_DIR = NEIGHBORHOOD_CATALOG_DIR;

async function fetchPageWithRetry(page: number, limit: number) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fetchSemsaraiProperties({ page, limit });
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
  throw lastError;
}

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
  console.info("[geography:build] Démarrage scan API semsarai.ma…");

  const seenIds = new Set<string>();
  const cityMap = new Map<
    string,
    { count: number; region: string; neighborhoods: Map<string, number> }
  >();
  const cityCatalogs = new Map<string, Map<string, SemsaraiProperty[]>>();

  function ingest(city: string, regionHint: string, neighborhood: string, propertyId?: string) {
    const c = city?.trim();
    if (!c) return;
    if (propertyId) {
      if (seenIds.has(propertyId)) return;
      seenIds.add(propertyId);
    }
    const region = resolveMoroccoRegion(c, regionHint?.trim() || undefined);
    const hood = neighborhood?.trim() || c;
    const entry = cityMap.get(c) ?? { count: 0, region, neighborhoods: new Map() };
    entry.count += 1;
    entry.neighborhoods.set(hood, (entry.neighborhoods.get(hood) ?? 0) + 1);
    cityMap.set(c, entry);
  }

  function ingestProperty(p: SemsaraiProperty) {
    const city = p.cityName?.trim();
    if (!city || seenIds.has(p.id)) return;
    seenIds.add(p.id);

    const hood = p.quartier?.trim() || city;
    ingest(city, city, hood);

    const citySlug = slugify(city);
    const hoodKey = normalizeLocationKey(hood);
    const cityEntry = cityCatalogs.get(citySlug) ?? new Map<string, SemsaraiProperty[]>();
    const listings = cityEntry.get(hoodKey) ?? [];
    listings.push(compactProperty(p));
    cityEntry.set(hoodKey, listings);
    cityCatalogs.set(citySlug, cityEntry);
  }

  for (const l of getStaticCatalogListings()) {
    const extId = l.externalId ?? l.id.replace(/^semsar-/, "");
    ingest(l.location.city, l.location.region ?? l.location.city, l.location.neighborhood, extId);
  }
  for (const l of fetchHoldingListings()) {
    ingest(l.location.city, l.location.region ?? l.location.city, l.location.neighborhood, l.id);
  }

  const staticCount = getStaticCatalogListings().length + fetchHoldingListings().length;
  let scanned = seenIds.size;
  let apiTotal = 0;

  const first = await fetchPageWithRetry(1, PAGE_SIZE);
  apiTotal = first.totalCount;
  for (const p of first.properties) {
    ingestProperty(p);
  }
  scanned = seenIds.size;

  console.info(
    `[geography:build] API annonce ${apiTotal.toLocaleString("fr-MA")} — scan page par page (${PAGE_SIZE}/page, concurrence ${CONCURRENCY})`,
  );

  let nextPage = 2;
  let emptyStreak = 0;

  async function worker() {
    while (true) {
      const page = nextPage++;
      if (emptyStreak >= CONCURRENCY) return;

      try {
        const batch = await fetchPageWithRetry(page, PAGE_SIZE);
        if (!batch.properties.length) {
          emptyStreak += 1;
          continue;
        }
        emptyStreak = 0;
        for (const p of batch.properties) {
          ingestProperty(p);
        }
        scanned = seenIds.size;
        if (page % 20 === 0) {
          console.info(
            `[geography:build] Page ${page} — ${cityMap.size} villes, ${scanned.toLocaleString("fr-MA")} annonces uniques`,
          );
        }
      } catch (err) {
        console.warn(`[geography:build] Page ${page} abandonnée:`, err);
        emptyStreak += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  mkdirSync(CATALOG_DIR, { recursive: true });
  for (const [citySlug, neighborhoods] of cityCatalogs.entries()) {
    const cityName =
      Array.from(cityMap.keys()).find((c) => slugify(c) === citySlug) ?? citySlug;
    const hoodEntries: Record<string, SemsaraiProperty[]> = {};
    for (const [hoodKey, listings] of neighborhoods.entries()) {
      const hoodName =
        Array.from(cityMap.get(cityName)?.neighborhoods.keys() ?? []).find(
          (n) => normalizeLocationKey(n) === hoodKey,
        ) ?? hoodKey;
      hoodEntries[hoodName] = listings;
    }
    writeFileSync(
      path.join(CATALOG_DIR, `${citySlug}.json`),
      JSON.stringify(
        {
          builtAt: new Date().toISOString(),
          city: cityName,
          neighborhoods: hoodEntries,
        },
        null,
        0,
      ),
    );
  }

  const index = finalizeIndex(cityMap, scanned, apiTotal);
  saveGeographyIndex(index);

  console.info(
    `\n✓ Index géographique : ${index.cities.length} villes, ${index.regions.length} régions`,
  );
  console.info(
    `  ${index.totalListingsScanned.toLocaleString("fr-MA")} annonces uniques / ${index.apiTotalCount.toLocaleString("fr-MA")} total API`,
  );
  console.info(`  → data/cache/morocco-geography.json`);
  console.info(`  → ${cityCatalogs.size} fichiers quartier dans data/cache/neighborhood-catalog/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
