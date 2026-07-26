#!/usr/bin/env tsx
import "dotenv/config";
import { isScrapePortal, listImplementedScrapePortals } from "../src/lib/scraping/portals";
import { runPortalScrape } from "../src/lib/scraping/run-scrape";
import type { ScrapePortal } from "../src/lib/scraping/types";

async function main() {
  const portalsArg = process.argv.find((arg) => arg.startsWith("--portals="));
  const portals = portalsArg
    ? portalsArg
        .replace("--portals=", "")
        .split(",")
        .map((v) => v.trim())
        .filter(isScrapePortal)
    : undefined;

  if (process.argv.includes("--fast") || process.argv.includes("--turbo")) {
    process.env.SCRAPE_FAST = "true";
    process.env.SCRAPE_DELAY_MS ??= "0";
  }
  if (process.argv.includes("--polite")) {
    process.env.SCRAPE_FAST = "false";
  }

  const implemented = listImplementedScrapePortals()
    .map((p) => p.scrapePortal)
    .filter((p): p is ScrapePortal => Boolean(p));

  const wallStart = Date.now();
  console.info("[scrape:portals] Portails scrapables:", implemented.join(", "));
  console.info(
    "[scrape:portals] Turbo parallèle (delay=0) —",
    portals?.length ? `filtre=${portals.join(",")}` : "défaut=tous",
    "\n",
  );

  const { results, outputDir } = await runPortalScrape({ portals, delayMs: Number(process.env.SCRAPE_DELAY_MS ?? 0) });

  let total = 0;
  for (const result of results) {
    total += result.listings.length;
    const status = result.errors.length ? "⚠" : "✓";
    console.info(
      `${status} ${result.source}: ${result.listings.length} annonces → ${outputDir}/${result.source}.json`,
    );
    if (result.errors.length) {
      console.info(`   ${result.errors.slice(0, 3).join("\n   ")}`);
      if (result.errors.length > 3) {
        console.info(`   … +${result.errors.length - 3} erreurs`);
      }
    }
  }

  const wallSec = ((Date.now() - wallStart) / 1000).toFixed(1);
  console.info(`\n⏱ Total wall-clock: ${wallSec}s — ${total} annonces`);
  console.info("Sync catalogue: SCRAPING_ENABLED=true pnpm aggregation:sync");
  console.info("Inventaire portails: docs/MOROCCO_PORTALS.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
