#!/usr/bin/env tsx
import "dotenv/config";
import { runPortalScrape } from "../src/lib/scraping/run-scrape";

async function main() {
  const portalsArg = process.argv.find((arg) => arg.startsWith("--portals="));
  const portals = portalsArg
    ? (portalsArg.replace("--portals=", "").split(",") as Array<"sarouty" | "mubawab" | "avito">)
    : undefined;

  console.info("[scrape:portals] Démarrage scraping Avito / Mubawab / Sarouty…");
  console.info("⚠️  Usage à vos risques — respectez les CGU des portails et limitez la fréquence.\n");

  const { results, outputDir } = await runPortalScrape({ portals });

  for (const result of results) {
    const status = result.errors.length ? "⚠" : "✓";
    console.info(`${status} ${result.source}: ${result.listings.length} annonces → ${outputDir}/${result.source}.json`);
    if (result.errors.length) {
      console.info(`   ${result.errors.slice(0, 3).join("\n   ")}`);
      if (result.errors.length > 3) {
        console.info(`   … +${result.errors.length - 3} erreurs`);
      }
    }
  }

  console.info("\nSync catalogue: pnpm aggregation:sync");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
