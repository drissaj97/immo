#!/usr/bin/env tsx
import "dotenv/config";
import { syncAggregatedCatalog } from "../src/lib/aggregation/sync";

async function main() {
  console.info("[aggregation:sync] Démarrage synchronisation multi-sources…");
  const { listings, results } = await syncAggregatedCatalog();

  console.info(`\n✓ ${listings.length} annonces agrégées (${listings.filter((l) => l.status === "published").length} publiées)\n`);

  for (const r of results) {
    const status = r.errors.length ? "⚠" : "✓";
    console.info(`${status} ${r.source}: ${r.imported} importées${r.errors.length ? ` — ${r.errors[0]}` : ""}`);
  }

  const bySource = listings.reduce<Record<string, number>>((acc, l) => {
    acc[l.aggregationSource] = (acc[l.aggregationSource] ?? 0) + 1;
    return acc;
  }, {});
  console.info("\nPar source:", bySource);

  if (!process.env.PROPAPIS_API_KEY && !process.env.AVITO_PARTNER_FEED_URL) {
    console.info("\nℹ Avito/Mubawab: déposez data/feeds/avito.json ou configurez PROPAPIS_API_KEY");
    console.info("  Voir docs/AGGREGATION.md pour les partenariats officiels.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
