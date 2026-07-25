import type { Comparable, MarketMetric } from "@/lib/data/market-data";
import { DEMO_COMPARABLES, DEMO_MARKET_METRICS } from "@/lib/data/market-data";

export type ValuationResult = {
  estimatedMin: number;
  estimatedMax: number;
  estimatedMid: number;
  pricePerSqm: number;
  comparablesUsed: Comparable[];
  methodology: string;
  confidence: "low" | "medium" | "high";
  isDemo: true;
  calculatedAt: string;
};

export function findMarketMetric(
  city: string,
  neighborhood: string,
  listingType: string,
): MarketMetric | null {
  return (
    DEMO_MARKET_METRICS.find(
      (m) =>
        m.city.toLowerCase() === city.toLowerCase() &&
        m.neighborhood.toLowerCase() === neighborhood.toLowerCase() &&
        m.listingType === listingType,
    ) ??
    DEMO_MARKET_METRICS.find(
      (m) => m.city.toLowerCase() === city.toLowerCase() && m.listingType === listingType,
    ) ??
    null
  );
}

export function findComparables(
  city: string,
  neighborhood: string,
  livingArea?: number,
  limit = 5,
): Comparable[] {
  let comps = DEMO_COMPARABLES.filter(
    (c) =>
      c.city.toLowerCase() === city.toLowerCase() &&
      (c.neighborhood.toLowerCase() === neighborhood.toLowerCase() ||
        neighborhood.toLowerCase().includes(c.neighborhood.toLowerCase())),
  );

  if (comps.length === 0) {
    comps = DEMO_COMPARABLES.filter((c) => c.city.toLowerCase() === city.toLowerCase());
  }

  if (livingArea) {
    comps = comps
      .map((c) => ({ ...c, areaDiff: Math.abs(c.livingArea - livingArea) }))
      .sort((a, b) => (a as Comparable & { areaDiff: number }).areaDiff - (b as Comparable & { areaDiff: number }).areaDiff)
      .map(({ areaDiff, ...c }) => c);
  }

  return comps.slice(0, limit);
}

export function estimateFromComparables(
  livingArea: number,
  city: string,
  neighborhood: string,
  listingType: string,
): ValuationResult {
  const comparables = findComparables(city, neighborhood, livingArea);
  const market = findMarketMetric(city, neighborhood, listingType);

  let pricePerSqm: number;
  if (comparables.length >= 2) {
    pricePerSqm = comparables.reduce((s, c) => s + c.pricePerSqm, 0) / comparables.length;
  } else if (market) {
    pricePerSqm = market.avgPricePerSqm;
  } else {
    pricePerSqm = 15000;
  }

  const estimatedMid = Math.round(pricePerSqm * livingArea);
  const spread = comparables.length >= 2 ? 0.08 : 0.15;

  return {
    estimatedMin: Math.round(estimatedMid * (1 - spread)),
    estimatedMax: Math.round(estimatedMid * (1 + spread)),
    estimatedMid,
    pricePerSqm: Math.round(pricePerSqm),
    comparablesUsed: comparables,
    methodology:
      comparables.length >= 2
        ? "Moyenne des prix au m² de comparables de vente récents (données fictives)"
        : "Estimation par moyenne sectorielle faute de comparables directs",
    confidence: comparables.length >= 3 ? "high" : comparables.length >= 1 ? "medium" : "low",
    isDemo: true,
    calculatedAt: new Date().toISOString(),
  };
}
