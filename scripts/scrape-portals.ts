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

  const implemented = listImplementedScrapePortals()
    .map((p) => p.scrapePortal)
    .filter((p): p is ScrapePortal => Boolean(p));

  console.info("[scrape:portals] Portails scrapables:", implemented.join(", "));
  console.info(
    "[scrape:portals] Démarrage…",
    portals?.length ? `filtre=${portals.join(",")}` : "défaut=tous",
    "\n",
  );

  const { results, outputDir } = await runPortalScrape({ portals });

  for (const result of results) {
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

  console.info("\nSync catalogue: SCRAPING_ENABLED=true pnpm aggregation:sync");
  console.info("Inventaire portails: docs/MOROCCO_PORTALS.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
