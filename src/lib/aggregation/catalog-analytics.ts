import type { DemoListing } from "@/lib/data/demo-data";
import type { Comparable, MarketMetric } from "@/lib/data/market-data";
import type { NeighborhoodKnowledge } from "@/lib/data/neighborhood-knowledge";
import { getStaticCatalogListings } from "./catalog";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

let metricsCache: MarketMetric[] | null = null;
let neighborhoodsCache: NeighborhoodKnowledge[] | null = null;

export function resetCatalogAnalyticsCache(): void {
  metricsCache = null;
  neighborhoodsCache = null;
}

export function getCatalogListings(): DemoListing[] {
  return getStaticCatalogListings();
}

function groupKey(city: string, neighborhood: string, listingType?: string): string {
  return `${city.toLowerCase()}|${neighborhood.toLowerCase()}|${listingType ?? "*"}`;
}

export function computeMarketMetrics(): MarketMetric[] {
  if (metricsCache) return metricsCache;

  const all = getCatalogListings();
  const saleListings = all.filter(
    (l) => l.transactionType === "sale" && (l.livingArea ?? 0) > 0,
  );
  const rentListings = all.filter(
    (l) => l.transactionType === "long_term_rent" && (l.livingArea ?? 0) > 0,
  );

  const rentByHood = new Map<string, DemoListing[]>();
  for (const r of rentListings) {
    const key = groupKey(r.location.city, r.location.neighborhood, r.listingType);
    const arr = rentByHood.get(key) ?? [];
    arr.push(r);
    rentByHood.set(key, arr);
  }

  const saleGroups = new Map<string, DemoListing[]>();
  for (const l of saleListings) {
    const key = groupKey(l.location.city, l.location.neighborhood, l.listingType);
    const arr = saleGroups.get(key) ?? [];
    arr.push(l);
    saleGroups.set(key, arr);
  }

  const metrics: MarketMetric[] = [];

  for (const [, items] of saleGroups) {
    if (items.length < 2) continue;
    const sample = items[0];
    const pricesPerSqm = items.map((l) => l.price / (l.livingArea ?? 1));
    const avgPricePerSqm = Math.round(
      pricesPerSqm.reduce((a, b) => a + b, 0) / pricesPerSqm.length,
    );

    const rentKey = groupKey(sample.location.city, sample.location.neighborhood, sample.listingType);
    const rents = rentByHood.get(rentKey) ?? [];
    const avgRentPerSqm =
      rents.length > 0
        ? Math.round(
            rents.reduce((s, r) => s + r.price / (r.livingArea ?? 1), 0) / rents.length,
          )
        : Math.round(avgPricePerSqm * 0.0045);
    const avgYield =
      avgPricePerSqm > 0
        ? Math.round(((avgRentPerSqm * 12) / avgPricePerSqm) * 1000) / 10
        : 0;

    metrics.push({
      city: sample.location.city,
      neighborhood: sample.location.neighborhood,
      listingType: sample.listingType,
      avgPricePerSqm,
      avgRentPerSqm,
      avgYield,
      sampleSize: items.length,
      updatedAt: new Date().toISOString().slice(0, 10),
      source: `DarBladi — ${items.length} annonces agrégées`,
      isDemo: false,
    });
  }

  metricsCache = metrics.sort((a, b) => b.sampleSize - a.sampleSize);
  return metricsCache;
}

export function findCatalogMarketMetric(
  city: string,
  neighborhood: string,
  listingType: string,
): MarketMetric | null {
  const metrics = computeMarketMetrics();
  return (
    metrics.find(
      (m) =>
        m.city.toLowerCase() === city.toLowerCase() &&
        m.neighborhood.toLowerCase() === neighborhood.toLowerCase() &&
        m.listingType === listingType,
    ) ??
    metrics.find(
      (m) => m.city.toLowerCase() === city.toLowerCase() && m.listingType === listingType,
    ) ??
    metrics.find((m) => m.city.toLowerCase() === city.toLowerCase()) ??
    null
  );
}

export function findCatalogComparables(
  city: string,
  neighborhood: string,
  livingArea?: number,
  limit = 5,
): Comparable[] {
  const all = getCatalogListings();
  let comps = all.filter(
    (l) =>
      l.transactionType === "sale" &&
      (l.livingArea ?? 0) > 0 &&
      l.location.city.toLowerCase() === city.toLowerCase() &&
      l.location.neighborhood.toLowerCase() === neighborhood.toLowerCase(),
  );

  if (comps.length === 0) {
    comps = all.filter(
      (l) =>
        l.transactionType === "sale" &&
        (l.livingArea ?? 0) > 0 &&
        l.location.city.toLowerCase() === city.toLowerCase(),
    );
  }

  if (livingArea) {
    comps = [...comps].sort(
      (a, b) =>
        Math.abs((a.livingArea ?? 0) - livingArea) - Math.abs((b.livingArea ?? 0) - livingArea),
    );
  }

  return comps.slice(0, limit).map((l) => ({
    id: l.id,
    listingId: l.id,
    title: l.title,
    city: l.location.city,
    neighborhood: l.location.neighborhood,
    price: l.price,
    livingArea: l.livingArea!,
    pricePerSqm: Math.round(l.price / l.livingArea!),
    isDemo: false,
  }));
}

export function buildCatalogNeighborhoods(): NeighborhoodKnowledge[] {
  if (neighborhoodsCache) return neighborhoodsCache;

  const all = getCatalogListings();
  const groups = new Map<string, DemoListing[]>();

  for (const l of all) {
    const key = `${l.location.city}|${l.location.neighborhood}`;
    const arr = groups.get(key) ?? [];
    arr.push(l);
    groups.set(key, arr);
  }

  const metricByHood = new Map(
    computeMarketMetrics().map((m) => [
      `${m.city.toLowerCase()}|${m.neighborhood.toLowerCase()}`,
      m,
    ]),
  );

  neighborhoodsCache = Array.from(groups.entries())
    .filter(([, items]) => items.length >= 2)
    .map(([key, items]) => {
      const [city, neighborhood] = key.split("|");
      const slug = `${slugify(city)}/${slugify(neighborhood)}`;
      const metric = metricByHood.get(key.toLowerCase());
      const types = [...new Set(items.map((l) => l.listingType))];
      const prices = items.map((l) => l.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const saleCount = items.filter((l) => l.transactionType === "sale").length;
      const rentCount = items.filter((l) => l.transactionType === "long_term_rent").length;

      return {
        slug,
        city,
        neighborhood,
        region: items[0].location.region ?? city,
        summary: `${items.length} annonces actives indexées à ${neighborhood}, ${city} — vente ${saleCount}, location ${rentCount}.`,
        highlights: [
          `${items.length} biens disponibles`,
          `Types : ${types.join(", ")}`,
          `Fourchette : ${minPrice.toLocaleString("fr-MA")} – ${maxPrice.toLocaleString("fr-MA")} MAD`,
        ],
        investmentNotes: metric
          ? [
              `Prix moyen ~${metric.avgPricePerSqm.toLocaleString("fr-MA")} MAD/m² (${metric.sampleSize} ventes)`,
              metric.avgYield
                ? `Rendement locatif indicatif ~${metric.avgYield}%`
                : "Données locatives en cours d'agrégation",
            ]
          : ["Échantillon insuffisant pour une analyse investissement détaillée"],
        avgPricePerSqm: metric?.avgPricePerSqm,
        avgYield: metric?.avgYield,
        tags: types,
        isDemo: false,
        listingCount: items.length,
      } as NeighborhoodKnowledge & { listingCount: number };
    })
    .sort(
      (a, b) =>
        (b as NeighborhoodKnowledge & { listingCount: number }).listingCount -
        (a as NeighborhoodKnowledge & { listingCount: number }).listingCount,
    );

  return neighborhoodsCache;
}

export function getCatalogNeighborhoodBySlug(slug: string): NeighborhoodKnowledge | undefined {
  return buildCatalogNeighborhoods().find((n) => n.slug === slug.toLowerCase());
}

export function getCatalogNeighborhoodsByCity(city: string): NeighborhoodKnowledge[] {
  return buildCatalogNeighborhoods().filter(
    (n) => n.city.toLowerCase() === city.toLowerCase(),
  );
}
