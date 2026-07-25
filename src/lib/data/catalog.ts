import { getAggregatedListings, getAggregationStats, resetAggregationCache, syncAggregatedCatalog } from "@/lib/aggregation/sync";
import { HOLDING_IMPORT_META } from "@/lib/data/holding-listings";

export async function getListingCatalogStats() {
  const stats = await getAggregationStats();
  return {
    total: stats.total,
    published: stats.published,
    holdingImmo: stats.bySource["holding-immo"] ?? 0,
    semsarai: stats.bySource["semsarai"] ?? 0,
    demoSeed: stats.bySource["darbladi"] ?? 0,
    avito: stats.bySource["avito"] ?? 0,
    mubawab: stats.bySource["mubawab"] ?? 0,
    cities: stats.cities,
    bySource: stats.bySource,
    holdingMeta: HOLDING_IMPORT_META,
    aggregation: stats,
  };
}

export { getAggregatedListings, getAggregationStats, resetAggregationCache, syncAggregatedCatalog };
