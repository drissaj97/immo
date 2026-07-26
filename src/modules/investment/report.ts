import type { DemoListing } from "@/lib/data/demo-data";
import type { PriceHistoryPoint } from "@/lib/data/market-data";
import { getDefaultPriceHistory } from "@/lib/data/market-data";
import { calculateInvestment, applyScenarioMultiplier, type InvestmentInputs, type InvestmentResults } from "./calculations";
import { calculateInvestmentScore, type InvestmentScore } from "./score";
import { findMarketMetric } from "./valuation";

export type InvestmentReport = {
  id: string;
  listing: {
    id: string;
    slug: string;
    title: string;
    reference: string;
    city: string;
    neighborhood: string;
    price: number;
    currency: string;
    livingArea?: number;
  };
  generatedAt: string;
  isDemo: boolean;
  disclaimer: string;
  score: InvestmentScore;
  scenarios: {
    prudent: InvestmentResults;
    central: InvestmentResults;
    optimistic: InvestmentResults;
  };
  priceHistory: PriceHistoryPoint[];
  priceChangePercent: number;
  sources: string[];
};

const BASE_INPUTS: Omit<InvestmentInputs, "purchasePrice" | "annualRent"> = {
  acquisitionFeesRate: 6,
  renovationCost: 0,
  furnishingCost: 0,
  downPaymentRate: 30,
  loanRate: 4.5,
  loanYears: 20,
  vacancyRate: 8,
  chargesRate: 5,
  maintenanceRate: 1,
  managementRate: 8,
  insuranceAnnual: 2400,
  taxRate: 0,
};

export function buildInvestmentReport(listing: DemoListing): InvestmentReport {
  const annualRent = listing.estimatedYield
    ? (listing.price * listing.estimatedYield) / 100
    : listing.price * 0.04;

  const inputs: InvestmentInputs = {
    ...BASE_INPUTS,
    purchasePrice: listing.price,
    annualRent,
    isSeasonal: listing.transactionType === "seasonal_rent",
  };

  const market = findMarketMetric(
    listing.location.city,
    listing.location.neighborhood,
    listing.listingType,
  );

  const priceHistory = getDefaultPriceHistory(listing.reference, listing.price);
  const firstPrice = priceHistory[0]?.price ?? listing.price;
  const priceChangePercent = ((listing.price - firstPrice) / firstPrice) * 100;

  return {
    id: `report-${listing.id}-${Date.now()}`,
    listing: {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      reference: listing.reference,
      city: listing.location.city,
      neighborhood: listing.location.neighborhood,
      price: listing.price,
      currency: listing.currency,
      livingArea: listing.livingArea,
    },
    generatedAt: new Date().toISOString(),
    isDemo: false,
    disclaimer:
      "Rapport indicatif basé sur le catalogue agrégé DarBladi. Ne constitue pas un conseil en investissement, une expertise juridique ou une garantie de rendement.",
    score: calculateInvestmentScore(listing, market, inputs),
    scenarios: {
      prudent: calculateInvestment(applyScenarioMultiplier(inputs, "prudent"), listing.livingArea),
      central: calculateInvestment(inputs, listing.livingArea),
      optimistic: calculateInvestment(applyScenarioMultiplier(inputs, "optimistic"), listing.livingArea),
    },
    priceHistory,
    priceChangePercent,
    sources: [
      listing.sourceName,
      market?.source ?? "Métriques sectorielles indisponibles",
      "Calculs DarBladi v0.2",
    ],
  };
}
