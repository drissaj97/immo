import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { AggregationSourceId, PartnerFeedFile } from "@/lib/aggregation/types";
import { isScrapePortal } from "./portals";
import { logScrapeSpeedBanner, resolveDelayMs } from "./scrape-config";
import { scrapeAgenz } from "./sources/agenz-scraper";
import { scrapeAvito } from "./sources/avito-scraper";
import { scrapeMubawab } from "./sources/mubawab-scraper";
import { scrapeSarouty } from "./sources/sarouty-scraper";
import { scrapeYakeey } from "./sources/yakeey-scraper";
import type { ScrapeOptions, ScrapePortal, ScrapeResult, ScrapeSummary } from "./types";

const FEED_DIR = path.join(process.cwd(), "data/feeds");

const PORTAL_SOURCE: Record<ScrapePortal, AggregationSourceId> = {
  sarouty: "sarouty",
  mubawab: "mubawab",
  avito: "avito",
  agenz: "agenz",
  yakeey: "yakeey",
};

type PortalRunner = (options: ScrapeOptions) => Promise<{
  listings: ScrapeResult["listings"];
  errors: string[];
}>;

const PORTAL_RUNNERS: Record<ScrapePortal, PortalRunner> = {
  sarouty: scrapeSarouty,
  mubawab: scrapeMubawab,
  avito: scrapeAvito,
  agenz: scrapeAgenz,
  yakeey: scrapeYakeey,
};

export async function runPortalScrape(options: ScrapeOptions = {}): Promise<ScrapeSummary> {
  const enabled = options.portals ?? parsePortalsEnv();
  mkdirSync(FEED_DIR, { recursive: true });

  const parallel = process.env.SCRAPE_PARALLEL !== "false";
  const delayMs = resolveDelayMs(options.delayMs);
  const turboOptions: ScrapeOptions = { ...options, delayMs };
  logScrapeSpeedBanner();
  console.info(
    `[scrape] portails: ${enabled.join(", ")} — ${parallel ? "TOUS EN PARALLÈLE" : "séquentiel"}`,
  );

  const runOne = async (portal: ScrapePortal): Promise<ScrapeResult> => {
    const started = Date.now();
    const scrapedAt = new Date().toISOString();
    let listings: ScrapeResult["listings"] = [];
    let errors: string[] = [];

    try {
      ({ listings, errors } = await PORTAL_RUNNERS[portal](turboOptions));
    } catch (err) {
      errors = [String(err)];
    }

    const source = PORTAL_SOURCE[portal];

    if (listings.length === 0) {
      const previous = loadExistingFeed(source);
      if (previous?.listings?.length) {
        errors.push(
          `0 nouvelles annonces — conservation du feed précédent (${previous.listings.length})`,
        );
        listings = previous.listings;
      }
    }

    const feed: PartnerFeedFile = {
      source,
      licenseStatus: "scraped",
      syncedAt: scrapedAt,
      listings,
    };

    writeFileSync(path.join(FEED_DIR, `${source}.json`), JSON.stringify(feed, null, 2), "utf-8");
    const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);
    const rate = listings.length
      ? (listings.length / Math.max(0.001, (Date.now() - started) / 1000)).toFixed(1)
      : "0";
    console.info(`[scrape] ${source}: ${listings.length} annonces en ${elapsedSec}s (~${rate}/s)`);
    return { source, listings, errors, scrapedAt };
  };

  const results = parallel
    ? await Promise.all(enabled.map((portal) => runOne(portal)))
    : await (async () => {
        const out: ScrapeResult[] = [];
        for (const portal of enabled) out.push(await runOne(portal));
        return out;
      })();

  return { results, outputDir: FEED_DIR };
}

function loadExistingFeed(source: AggregationSourceId): PartnerFeedFile | null {
  const filePath = path.join(FEED_DIR, `${source}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as PartnerFeedFile;
  } catch {
    return null;
  }
}

function parsePortalsEnv(): ScrapePortal[] {
  const raw = process.env.SCRAPE_PORTALS ?? "sarouty,mubawab,avito,agenz,yakeey";
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(isScrapePortal);
}
