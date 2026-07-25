import type { AggregationSourceId, RawPartnerListing } from "@/lib/aggregation/types";

export type ScrapePortal = "sarouty" | "mubawab" | "avito";

export type ScrapeOptions = {
  portals?: ScrapePortal[];
  maxPages?: number;
  maxListings?: number;
  delayMs?: number;
  mubawabSeedLimit?: number;
};

export type ScrapeResult = {
  source: AggregationSourceId;
  listings: RawPartnerListing[];
  errors: string[];
  scrapedAt: string;
};

export type ScrapeSummary = {
  results: ScrapeResult[];
  outputDir: string;
};
