import type { Comparable, MarketMetric } from "@/lib/data/market-data";
import {
  computeMarketMetrics,
  findCatalogComparables,
  findCatalogMarketMetric,
} from "@/lib/aggregation/catalog-analytics";

export type ValuationResult = {
  estimatedMin: number;
  estimatedMax: number;
  estimatedMid: number;
  pricePerSqm: number;
  comparablesUsed: Comparable[];
  methodology: string;
  confidence: "low" | "medium" | "high";
  isDemo: boolean;
  calculatedAt: string;
};

export function findMarketMetric(
  city: string,
  neighborhood: string,
  listingType: string,
): MarketMetric | null {
  return findCatalogMarketMetric(city, neighborhood, listingType);
}

export function findComparables(
  city: string,
  neighborhood: string,
  livingArea?: number,
  limit = 5,
): Comparable[] {
  return findCatalogComparables(city, neighborhood, livingArea, limit);
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
        ? `Moyenne de ${comparables.length} annonces comparables du catalogue DarBladi`
        : market
          ? `Estimation basée sur ${market.sampleSize} annonces agrégées (${market.source})`
          : "Estimation sectorielle — échantillon insuffisant dans ce quartier",
    confidence: comparables.length >= 3 ? "high" : comparables.length >= 1 ? "medium" : "low",
    isDemo: false,
    calculatedAt: new Date().toISOString(),
  };
}

export { computeMarketMetrics as getLiveMarketMetrics };
