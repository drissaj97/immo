import type { DemoListing } from "@/lib/data/demo-data";
import type { PriceHistoryPoint } from "@/lib/data/market-data";
import { getDefaultPriceHistory } from "@/lib/data/market-data";
import { useDatabase } from "@/lib/db/repository";
import { calculateInvestmentScore, type InvestmentScore } from "@/modules/investment/score";
import { estimateFromComparables, findComparables, findMarketMetric, type ValuationResult } from "@/modules/investment/valuation";
import { buildInvestmentReport, type InvestmentReport } from "@/modules/investment/report";
import type { InvestmentInputs, InvestmentResults } from "@/modules/investment/calculations";
import { calculateInvestment, applyScenarioMultiplier } from "@/modules/investment/calculations";
import * as dbRepo from "@/server/repositories/investment-db";

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

export async function createInvestmentReport(
  listing: DemoListing,
  userId?: string,
): Promise<InvestmentReport> {
  const report = buildInvestmentReport(listing);
  reportStore.set(report.id, report);
  if (useDatabase()) {
    await dbRepo.dbSaveReport(userId, listing.id, report);
  }
  return report;
}

export async function getInvestmentReport(id: string): Promise<InvestmentReport | null> {
  if (useDatabase()) {
    const report = await dbRepo.dbGetReport(id);
    if (report) return report;
  }
  return reportStore.get(id) ?? null;
}

export async function saveSimulation(
  name: string,
  inputs: InvestmentInputs,
  scenario: SavedSimulation["scenario"],
  listingId?: string,
  userId?: string,
): Promise<SavedSimulation> {
  const scenarioInputs = applyScenarioMultiplier(inputs, scenario);
  const results = calculateInvestment(scenarioInputs);

  if (useDatabase() && userId) {
    const saved = await dbRepo.dbSaveSimulation(userId, name, scenarioInputs, results, scenario, listingId);
    if (saved) return saved;
  }

  const sim: SavedSimulation = {
    id: `sim-${Date.now()}`,
    name,
    listingId,
    inputs: scenarioInputs,
    results,
    scenario,
    createdAt: new Date().toISOString(),
    isDemo: true,
  };
  simulationStore.push(sim);
  return sim;
}

export async function listSimulations(userId?: string): Promise<SavedSimulation[]> {
  if (useDatabase() && userId) {
    const rows = await dbRepo.dbListSimulations(userId);
    if (rows.length > 0) return rows;
  }
  return [...simulationStore].reverse();
}

export async function listReports(userId?: string): Promise<InvestmentReport[]> {
  if (useDatabase() && userId) {
    const rows = await dbRepo.dbListReports(userId);
    if (rows.length > 0) return rows;
  }
  return Array.from(reportStore.values()).reverse();
}
