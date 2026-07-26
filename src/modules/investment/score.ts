import type { DemoListing } from "@/lib/data/demo-data";
import type { MarketMetric } from "@/lib/data/market-data";
import { calculateInvestment, type InvestmentInputs } from "./calculations";

export type ScoreDimension = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  weight: number;
  value?: string | number;
  missing?: boolean;
  explanation: string;
};

export type InvestmentScore = {
  overall: number;
  confidence: "low" | "medium" | "high";
  confidencePercent: number;
  calculatedAt: string;
  dimensions: ScoreDimension[];
  missingData: string[];
  summary: string;
};

const DEFAULT_INPUTS: InvestmentInputs = {
  purchasePrice: 0,
  acquisitionFeesRate: 6,
  renovationCost: 0,
  furnishingCost: 0,
  downPaymentRate: 30,
  loanRate: 4.5,
  loanYears: 20,
  annualRent: 0,
  vacancyRate: 8,
  chargesRate: 5,
  maintenanceRate: 1,
  managementRate: 8,
  insuranceAnnual: 2400,
  taxRate: 0,
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function scoreNetYield(netYield: number): number {
  if (netYield >= 6) return 100;
  if (netYield >= 4) return 70 + (netYield - 4) * 15;
  if (netYield >= 2) return 40 + (netYield - 2) * 15;
  if (netYield >= 0) return netYield * 20;
  return 0;
}

function scoreCashFlow(monthly: number): number {
  if (monthly >= 5000) return 100;
  if (monthly >= 0) return 50 + (monthly / 5000) * 50;
  if (monthly >= -3000) return 50 + (monthly / 3000) * 50;
  return 0;
}

function scorePriceVsMarket(pricePerSqm: number, marketAvg: number): number {
  if (!marketAvg) return 50;
  const ratio = pricePerSqm / marketAvg;
  if (ratio <= 0.9) return 95;
  if (ratio <= 1.0) return 85;
  if (ratio <= 1.1) return 65;
  if (ratio <= 1.2) return 45;
  return 25;
}

export type InvestmentScoreOptions = {
  /** Admin uniquement — expose le nom de source partenaire dans la dimension crédibilité. */
  revealSources?: boolean;
};

export function calculateInvestmentScore(
  listing: DemoListing,
  market?: MarketMetric | null,
  inputs?: Partial<InvestmentInputs>,
  options?: InvestmentScoreOptions,
): InvestmentScore {
  const revealSources = options?.revealSources === true;
  const missingData: string[] = [];
  const annualRent =
    inputs?.annualRent ??
    (listing.estimatedYield
      ? (listing.price * listing.estimatedYield) / 100
      : undefined);

  if (!annualRent) missingData.push("Loyer annuel estimé");
  if (!listing.livingArea) missingData.push("Surface habitable");

  const investInputs: InvestmentInputs = {
    ...DEFAULT_INPUTS,
    purchasePrice: listing.price,
    annualRent: annualRent ?? listing.price * 0.04,
    ...inputs,
  };

  const results = calculateInvestment(investInputs, listing.livingArea);
  const pricePerSqm = listing.livingArea ? listing.price / listing.livingArea : 0;
  const marketAvg = market?.avgPricePerSqm ?? 0;

  const dimensions: ScoreDimension[] = [
    {
      key: "net_yield",
      label: "Rendement net",
      score: scoreNetYield(results.netYield),
      maxScore: 100,
      weight: 0.2,
      value: `${results.netYield.toFixed(2)} %`,
      explanation: "Rendement net annuel / coût total d'acquisition",
    },
    {
      key: "cash_flow",
      label: "Cash-flow mensuel",
      score: scoreCashFlow(results.monthlyCashFlow),
      maxScore: 100,
      weight: 0.15,
      value: `${Math.round(results.monthlyCashFlow).toLocaleString("fr-MA")} MAD`,
      explanation: "Revenu net mensuel − mensualité crédit",
    },
    {
      key: "price_per_sqm",
      label: "Prix au m² vs secteur",
      score: listing.livingArea && marketAvg ? scorePriceVsMarket(pricePerSqm, marketAvg) : 50,
      maxScore: 100,
      weight: 0.12,
      value: listing.livingArea ? `${Math.round(pricePerSqm).toLocaleString("fr-MA")} MAD/m²` : undefined,
      missing: !listing.livingArea || !marketAvg,
      explanation: marketAvg
        ? `Secteur : ~${Math.round(marketAvg).toLocaleString("fr-MA")} MAD/m² (${market?.sampleSize ?? 0} obs. démo)`
        : "Données sectorielles indisponibles",
    },
    {
      key: "location",
      label: "Qualité emplacement",
      score: listing.location.city === "Casablanca" || listing.location.city === "Rabat" ? 85 : 75,
      maxScore: 100,
      weight: 0.1,
      value: `${listing.location.neighborhood}, ${listing.location.city}`,
      explanation: "Score basé sur la demande locative estimée (démo)",
    },
    {
      key: "listing_quality",
      label: "Qualité annonce",
      score: listing.completenessScore,
      maxScore: 100,
      weight: 0.08,
      value: `${listing.completenessScore} %`,
      explanation: "Complétude des champs et médias",
    },
    {
      key: "freshness",
      label: "Fraîcheur donnée",
      score: listing.freshnessScore,
      maxScore: 100,
      weight: 0.08,
      value: `${listing.freshnessScore} %`,
      explanation: "Dernière vérification et mise à jour",
    },
    {
      key: "legal",
      label: "Risque documentaire",
      score: listing.hasTitleDeed ? 90 : listing.isVerified ? 70 : 40,
      maxScore: 100,
      weight: 0.1,
      value: listing.hasTitleDeed ? "Titre foncier déclaré" : "À confirmer",
      explanation: "Basé sur déclarations et vérifications (non expertise juridique)",
    },
    {
      key: "seller_credibility",
      label: "Crédibilité vendeur",
      score: listing.isVerified ? 90 : 55,
      maxScore: 100,
      weight: 0.07,
      value: revealSources
        ? listing.sourceName
        : listing.isVerified
          ? "Annonceur vérifié"
          : "Annonceur",
      explanation: listing.isVerified ? "Professionnel / annonce vérifiée" : "Vérification en attente",
    },
    {
      key: "seasonality",
      label: "Dépendance saisonnalité",
      score: listing.transactionType === "seasonal_rent" ? 55 : 80,
      maxScore: 100,
      weight: 0.05,
      value: listing.transactionType === "seasonal_rent" ? "Élevée" : "Faible",
      explanation: "Location saisonnière = volatilité des revenus",
    },
    {
      key: "liquidity",
      label: "Liquidité estimée",
      score: ["apartment", "villa"].includes(listing.listingType) ? 75 : 50,
      maxScore: 100,
      weight: 0.05,
      value: listing.listingType,
      explanation: "Facilité de revente estimée par type de bien (démo)",
    },
  ];

  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
  const overall = Math.round(
    dimensions.reduce((s, d) => s + d.score * d.weight, 0) / totalWeight,
  );

  const filledDimensions = dimensions.filter((d) => !d.missing).length;
  const confidencePercent = Math.round((filledDimensions / dimensions.length) * 100);
  const confidence: InvestmentScore["confidence"] =
    confidencePercent >= 80 ? "high" : confidencePercent >= 60 ? "medium" : "low";

  let summary: string;
  if (overall >= 75) summary = "Profil investissement attractif selon les données disponibles.";
  else if (overall >= 55) summary = "Profil équilibré — approfondir la due diligence.";
  else summary = "Plusieurs signaux prudents — vérifier prix, rendement et documents.";

  return {
    overall: clamp(overall),
    confidence,
    confidencePercent,
    calculatedAt: new Date().toISOString(),
    dimensions,
    missingData,
    summary,
  };
}
