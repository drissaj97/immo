import type { AggregatedListing, AggregationStats, AggregationSyncResult } from "./types";
import { dedupeAggregatedListings } from "./dedupe";
import { fetchDarbladiListings, fetchHoldingListings } from "./sources/holding-source";
import { fetchSemsaraiListings } from "./sources/semsarai-source";
import { fetchPartnerFeed } from "./sources/partner-feed";
import { fetchPropAPISListings } from "./sources/propapis-source";
import { AGGREGATION_SOURCES } from "./sources/registry";

let cachedCatalog: AggregatedListing[] | null = null;
let lastSyncAt: string | null = null;

export async function syncAggregatedCatalog(): Promise<{
  listings: AggregatedListing[];
  results: AggregationSyncResult[];
}> {
  const results: AggregationSyncResult[] = [];
  const batches: AggregatedListing[] = [];

  const sources: Array<{ name: string; fn: () => Promise<AggregatedListing[]> | AggregatedListing[] }> = [
    { name: "semsarai", fn: fetchSemsaraiListings },
    { name: "holding-immo", fn: fetchHoldingListings },
    { name: "darbladi", fn: fetchDarbladiListings },
    { name: "avito", fn: () => fetchPartnerFeed("avito") },
    { name: "mubawab", fn: () => fetchPartnerFeed("mubawab") },
    { name: "sarouty", fn: () => fetchPartnerFeed("sarouty") },
    { name: "propapis", fn: fetchPropAPISListings },
  ];

  for (const { name, fn } of sources) {
    try {
      const items = await fn();
      batches.push(...items);
      results.push({
        source: name as AggregationSyncResult["source"],
        imported: items.length,
        skipped: 0,
        errors: [],
      });
    } catch (err) {
      results.push({
        source: name as AggregationSyncResult["source"],
        imported: 0,
        skipped: 0,
        errors: [String(err)],
      });
    }
  }

  const deduped = dedupeAggregatedListings(batches);
  cachedCatalog = deduped;
  lastSyncAt = new Date().toISOString();

  return { listings: deduped, results };
}

export async function getAggregatedListings(): Promise<AggregatedListing[]> {
  if (!cachedCatalog) {
    const { listings } = await syncAggregatedCatalog();
    return listings;
  }
  return cachedCatalog;
}

export async function getAggregationStats(): Promise<AggregationStats> {
  const listings = await getAggregatedListings();
  const published = listings.filter((l) => l.status === "published");
  const bySource: Record<string, number> = {};

  for (const l of published) {
    bySource[l.aggregationSource] = (bySource[l.aggregationSource] ?? 0) + 1;
  }

  return {
    total: listings.length,
    published: published.length,
    bySource,
    cities: new Set(published.map((l) => l.location.city)).size,
    lastSyncAt,
    sources: AGGREGATION_SOURCES,
  };
}

export function resetAggregationCache(): void {
  cachedCatalog = null;
  lastSyncAt = null;
}
