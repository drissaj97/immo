#!/usr/bin/env tsx
/**
 * Construit l'index complet villes/régions/quartiers depuis l'API semsarai.ma.
 *
 * Usage:
 *   pnpm geography:build
 */
import "dotenv/config";
import { getStaticCatalogListings } from "../src/lib/aggregation/catalog";
import { fetchHoldingListings } from "../src/lib/aggregation/sources/holding-source";
import { fetchSemsaraiProperties } from "../src/lib/semsarai/client";
import { finalizeIndex, saveGeographyIndex } from "../src/lib/geography/index";
import { resolveMoroccoRegion } from "../src/lib/geography/morocco-regions";

const PAGE_SIZE = Number(process.env.SEMSARAI_PAGE_SIZE ?? "100");
const CONCURRENCY = Number(process.env.GEOGRAPHY_SCAN_CONCURRENCY ?? "5");
const MAX_RETRIES = Number(process.env.GEOGRAPHY_MAX_RETRIES ?? "3");

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

async function main() {
  console.info("[geography:build] Démarrage scan API semsarai.ma…");

  const cityMap = new Map<
    string,
    { count: number; region: string; neighborhoods: Map<string, number> }
  >();

  function ingest(city: string, regionHint: string, neighborhood: string) {
    const c = city?.trim();
    if (!c) return;
    const region = resolveMoroccoRegion(c, regionHint?.trim() || undefined);
    const hood = neighborhood?.trim() || c;
    const entry = cityMap.get(c) ?? { count: 0, region, neighborhoods: new Map() };
    entry.count += 1;
    entry.neighborhoods.set(hood, (entry.neighborhoods.get(hood) ?? 0) + 1);
    cityMap.set(c, entry);
  }

  for (const l of getStaticCatalogListings()) {
    ingest(l.location.city, l.location.region ?? l.location.city, l.location.neighborhood);
  }
  for (const l of fetchHoldingListings()) {
    ingest(l.location.city, l.location.region ?? l.location.city, l.location.neighborhood);
  }

  const staticCount = getStaticCatalogListings().length + fetchHoldingListings().length;
  let scanned = staticCount;
  let apiTotal = 0;

  const first = await fetchPageWithRetry(1, PAGE_SIZE);
  apiTotal = first.totalCount;
  for (const p of first.properties) {
    ingest(p.cityName, p.cityName, p.quartier ?? p.cityName);
  }
  scanned += first.properties.length;

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
          ingest(p.cityName, p.cityName, p.quartier ?? p.cityName);
        }
        scanned += batch.properties.length;
        if (page % 20 === 0) {
          console.info(
            `[geography:build] Page ${page} — ${cityMap.size} villes, ${scanned.toLocaleString("fr-MA")} annonces`,
          );
        }
      } catch (err) {
        console.warn(`[geography:build] Page ${page} abandonnée:`, err);
        emptyStreak += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const index = finalizeIndex(cityMap, scanned, apiTotal);
  saveGeographyIndex(index);

  console.info(
    `\n✓ Index géographique : ${index.cities.length} villes, ${index.regions.length} régions`,
  );
  console.info(
    `  ${index.totalListingsScanned.toLocaleString("fr-MA")} annonces scannées / ${index.apiTotalCount.toLocaleString("fr-MA")} total API`,
  );
  console.info(`  → data/cache/morocco-geography.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
