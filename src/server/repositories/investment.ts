import type { DemoListing } from "@/lib/data/demo-data";
import type { PriceHistoryPoint } from "@/lib/data/market-data";
import { getDefaultPriceHistory } from "@/lib/data/market-data";
import { calculateInvestmentScore, type InvestmentScore } from "@/modules/investment/score";
import { estimateFromComparables, findComparables, findMarketMetric, type ValuationResult } from "@/modules/investment/valuation";
import { buildInvestmentReport, type InvestmentReport } from "@/modules/investment/report";
import type { InvestmentInputs, InvestmentResults } from "@/modules/investment/calculations";
import { calculateInvestment, applyScenarioMultiplier } from "@/modules/investment/calculations";

export type SavedSimulation = {
  id: string;
  name: string;
  listingId?: string;
  inputs: InvestmentInputs;
  results: InvestmentResults;
  scenario: "prudent" | "central" | "optimistic";
  createdAt: string;
  isDemo: true;
};

const simulationStore: SavedSimulation[] = [];
const reportStore: Map<string, InvestmentReport> = new Map();

export function getPriceHistory(listing: DemoListing): PriceHistoryPoint[] {
  return getDefaultPriceHistory(listing.reference, listing.price);
}

export function getListingInvestmentScore(listing: DemoListing): InvestmentScore {
  const market = findMarketMetric(
    listing.location.city,
    listing.location.neighborhood,
    listing.listingType,
  );
  return calculateInvestmentScore(listing, market);
}

export function getListingValuation(listing: DemoListing): ValuationResult | null {
  if (!listing.livingArea) return null;
  return estimateFromComparables(
    listing.livingArea,
    listing.location.city,
    listing.location.neighborhood,
    listing.listingType,
  );
}

export function getComparablesForListing(listing: DemoListing) {
  return findComparables(listing.location.city, listing.location.neighborhood, listing.livingArea);
}

export function createInvestmentReport(listing: DemoListing): InvestmentReport {
  const report = buildInvestmentReport(listing);
  reportStore.set(report.id, report);
  return report;
}

export function getInvestmentReport(id: string): InvestmentReport | null {
  return reportStore.get(id) ?? null;
}

export function saveSimulation(
  name: string,
  inputs: InvestmentInputs,
  scenario: SavedSimulation["scenario"],
  listingId?: string,
): SavedSimulation {
  const scenarioInputs = applyScenarioMultiplier(inputs, scenario);
  const sim: SavedSimulation = {
    id: `sim-${Date.now()}`,
    name,
    listingId,
    inputs: scenarioInputs,
    results: calculateInvestment(scenarioInputs),
    scenario,
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
  simulationStore.push(sim);
  return sim;
}

export function listSimulations(userId?: string): SavedSimulation[] {
  void userId;
  return [...simulationStore].reverse();
}

export function listReports(): InvestmentReport[] {
  return Array.from(reportStore.values()).reverse();
}
