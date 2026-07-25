import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import type { AggregationSourceId, PartnerFeedFile } from "@/lib/aggregation/types";
import { scrapeAvito } from "./sources/avito-scraper";
import { scrapeMubawab } from "./sources/mubawab-scraper";
import { scrapeSarouty } from "./sources/sarouty-scraper";
import type { ScrapeOptions, ScrapePortal, ScrapeResult, ScrapeSummary } from "./types";

const FEED_DIR = path.join(process.cwd(), "data/feeds");

const PORTAL_SOURCE: Record<ScrapePortal, AggregationSourceId> = {
  sarouty: "sarouty",
  mubawab: "mubawab",
  avito: "avito",
};

export async function runPortalScrape(options: ScrapeOptions = {}): Promise<ScrapeSummary> {
  const enabled = options.portals ?? parsePortalsEnv();
  mkdirSync(FEED_DIR, { recursive: true });

  const results: ScrapeResult[] = [];

  for (const portal of enabled) {
    const scrapedAt = new Date().toISOString();
    let listings: ScrapeResult["listings"] = [];
    let errors: string[] = [];

    try {
      if (portal === "sarouty") {
        ({ listings, errors } = await scrapeSarouty(options));
      } else if (portal === "mubawab") {
        ({ listings, errors } = await scrapeMubawab(options));
      } else if (portal === "avito") {
        ({ listings, errors } = await scrapeAvito(options));
      }
    } catch (err) {
      errors = [String(err)];
    }

    const source = PORTAL_SOURCE[portal];
    const feed: PartnerFeedFile = {
      source,
      licenseStatus: "scraped",
      syncedAt: scrapedAt,
      listings,
    };

    writeFileSync(path.join(FEED_DIR, `${source}.json`), JSON.stringify(feed, null, 2), "utf-8");

    results.push({ source, listings, errors, scrapedAt });
  }

  return { results, outputDir: FEED_DIR };
}

function parsePortalsEnv(): ScrapePortal[] {
  const raw = process.env.SCRAPE_PORTALS ?? "sarouty,mubawab,avito";
  return raw
    .split(",")
    .map((value) => value.trim() as ScrapePortal)
    .filter((value): value is ScrapePortal => value === "sarouty" || value === "mubawab" || value === "avito");
}
