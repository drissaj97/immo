import { parseNaturalLanguageQuery, type SearchFilters } from "@/modules/search/natural-language-parser";
import { searchListings, getListingById } from "@/server/repositories/listings";
import { getListingInvestmentScore } from "@/server/repositories/investment";
import { calculateInvestment } from "@/modules/investment/calculations";
import { findMarketMetric } from "@/modules/investment/valuation";
import {
  formatKnowledgeForLLM,
  getNeighborhoodContext,
  searchNeighborhoodKnowledge,
} from "@/modules/ai/rag";
import type { ControlledToolResult, ToolContext } from "./types";

export async function toolSearchListings(
  filters: Record<string, unknown>,
  _ctx: ToolContext,
): Promise<ControlledToolResult> {
  const { items, total } = await searchListings({
    ...(filters as SearchFilters),
    includeDemo: true,
  });
  return {
    tool: "searchListings",
    source: "DarBladi — catalogue démo",
    data: { items: items.slice(0, 5).map((l) => ({
      id: l.id,
      title: l.title,
      slug: l.slug,
      price: l.price,
      city: l.location.city,
      neighborhood: l.location.neighborhood,
    })), total },
  };
}

export async function toolGetListing(id: string, _ctx: ToolContext): Promise<ControlledToolResult | null> {
  const listing = await getListingById(id);
  if (!listing) return null;
  return {
    tool: "getListing",
    source: listing.sourceName,
    data: {
      id: listing.id,
      title: listing.title,
      price: listing.price,
      description: listing.description.slice(0, 300),
      completenessScore: listing.completenessScore,
      isVerified: listing.isVerified,
      isDemo: listing.isDemo,
    },
  };
}

export async function toolCompareListings(
  ids: string[],
  _ctx: ToolContext,
): Promise<ControlledToolResult> {
  const listings = (await Promise.all(ids.slice(0, 2).map(getListingById))).filter(Boolean);
  const comparison = listings.map((l) => l && ({
    id: l.id,
    title: l.title,
    price: l.price,
    score: getListingInvestmentScore(l).overall,
    yield: l.estimatedYield,
  }));
  return {
    tool: "compareListings",
    source: "DarBladi — calculs investissement",
    data: { comparison },
  };
}

export async function toolCalculateInvestment(
  params: { purchasePrice: number; annualRent: number },
  _ctx: ToolContext,
): Promise<ControlledToolResult> {
  const results = calculateInvestment({
    purchasePrice: params.purchasePrice,
    acquisitionFeesRate: 6,
    renovationCost: 0,
    furnishingCost: 0,
    downPaymentRate: 30,
    loanRate: 4.5,
    loanYears: 20,
    annualRent: params.annualRent,
    vacancyRate: 8,
    chargesRate: 5,
    maintenanceRate: 1,
    managementRate: 8,
    insuranceAnnual: 2400,
    taxRate: 0,
  });
  return {
    tool: "calculateInvestment",
    source: "DarBladi — moteur de calcul (déterministe)",
    data: {
      netYield: results.netYield,
      monthlyCashFlow: results.monthlyCashFlow,
      grossYield: results.grossYield,
    },
  };
}

export async function toolGetMarketMetrics(
  params: { city: string; neighborhood: string; listingType: string },
  _ctx: ToolContext,
): Promise<ControlledToolResult> {
  const metric = findMarketMetric(params.city, params.neighborhood, params.listingType);
  return {
    tool: "getMarketMetrics",
    source: metric?.source ?? "DarBladi — métriques démo",
    data: metric ?? { message: "Aucune métrique pour ce secteur" },
  };
}

export async function toolGetNeighborhoodContext(
  params: { query?: string; city?: string; neighborhood?: string },
  _ctx: ToolContext,
): Promise<ControlledToolResult> {
  let knowledge = getNeighborhoodContext(params.city, params.neighborhood);

  if (!knowledge && params.query) {
    const matches = searchNeighborhoodKnowledge(params.query, 1);
    knowledge = matches[0]?.knowledge ?? null;
  }

  if (!knowledge) {
    return {
      tool: "getNeighborhoodContext",
      source: "DarBladi — RAG quartiers (démo)",
      data: { message: "Aucun contexte quartier trouvé pour cette requête." },
    };
  }

  return {
    tool: "getNeighborhoodContext",
    source: "DarBladi — base connaissance quartiers (fictive)",
    data: {
      slug: knowledge.slug,
      city: knowledge.city,
      neighborhood: knowledge.neighborhood,
      summary: knowledge.summary,
      highlights: knowledge.highlights,
      investmentNotes: knowledge.investmentNotes,
      avgPricePerSqm: knowledge.avgPricePerSqm,
      avgYield: knowledge.avgYield,
      contextText: formatKnowledgeForLLM(knowledge),
    },
  };
}

export async function executeFromNaturalLanguage(
  query: string,
  ctx: ToolContext,
): Promise<{
  parsed: ReturnType<typeof parseNaturalLanguageQuery>;
  toolResults: ControlledToolResult[];
}> {
  const parsed = parseNaturalLanguageQuery(query);
  const toolResults: ControlledToolResult[] = [];

  const searchResult = await toolSearchListings(parsed.filters, ctx);
  toolResults.push(searchResult);

  if (parsed.filters.city && parsed.filters.neighborhood) {
    toolResults.push(
      await toolGetMarketMetrics({
        city: parsed.filters.city,
        neighborhood: parsed.filters.neighborhood,
        listingType: parsed.filters.listingType ?? "apartment",
      }, ctx),
    );
    toolResults.push(
      await toolGetNeighborhoodContext({
        city: parsed.filters.city,
        neighborhood: parsed.filters.neighborhood,
        query,
      }, ctx),
    );
  } else if (parsed.filters.city) {
    toolResults.push(
      await toolGetNeighborhoodContext({ city: parsed.filters.city, query }, ctx),
    );
  } else {
    const ragMatches = searchNeighborhoodKnowledge(query, 1);
    if (ragMatches.length > 0) {
      toolResults.push(
        await toolGetNeighborhoodContext({ query }, ctx),
      );
    }
  }

  return { parsed, toolResults };
}
