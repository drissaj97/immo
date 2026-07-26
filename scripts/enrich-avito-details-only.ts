#!/usr/bin/env tsx
/** Backfill photos Avito via fiches détail — écrit le feed à chaque succès. */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { chromium } from "playwright";
import { extractAvitoImagesFromHtml } from "../src/lib/scraping/sources/avito-images";
import { sanitizeListingImages } from "../src/lib/media/listing-images";
import type { PartnerFeedFile } from "../src/lib/aggregation/types";

async function main() {
  const feedPath = path.join(process.cwd(), "data/feeds/avito.json");
  const feed = JSON.parse(readFileSync(feedPath, "utf-8")) as PartnerFeedFile;
  const preferIds = new Set(
    (process.env.ENRICH_AVITO_IDS ?? "56552649,57218608").split(",").map((s) => s.trim()),
  );
  const limit = Number(process.env.ENRICH_AVITO_DETAIL_LIMIT ?? 100);

  const missing = feed.listings
    .filter((l) => !sanitizeListingImages(l.images).length && l.sourceUrl)
    .sort((a, b) => Number(preferIds.has(b.externalId)) - Number(preferIds.has(a.externalId)));
  const targets = missing.slice(0, limit);
  console.info(`[details] ${targets.length} cibles (${missing.length} sans photo) cwd=${process.cwd()}`);

  let updated = 0;
  let cfStreak = 0;

  for (let i = 0; i < targets.length; i++) {
    const listing = targets[i]!;
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
    });
    try {
      const context = await browser.newContext({
        locale: "fr-FR",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      });
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      });
      const page = await context.newPage();
      await page.goto(listing.sourceUrl!, { waitUntil: "domcontentloaded", timeout: 35000 });
      await page.waitForTimeout(1400);
      const html = await page.content();
      const title = await page.title();
      await context.close();

      if (/Just a moment|Un instant/i.test(title) && html.length < 120000) {
        cfStreak += 1;
        console.warn(`cf ${listing.externalId}`);
        await new Promise((r) => setTimeout(r, 3000 + cfStreak * 800));
        continue;
      }
      cfStreak = 0;

      const images = extractAvitoImagesFromHtml(html);
      if (!images.length) {
        console.info(`empty ${listing.externalId}`);
        continue;
      }

      const idx = feed.listings.findIndex((l) => l.externalId === listing.externalId);
      if (idx < 0) continue;
      feed.listings[idx] = { ...feed.listings[idx]!, images };
      updated += 1;
      feed.syncedAt = new Date().toISOString();
      writeFileSync(feedPath, JSON.stringify(feed));
      console.info(`ok ${listing.externalId} → ${images[0]} (updated=${updated})`);
    } catch (err) {
      console.warn(`err ${listing.externalId}: ${String(err).slice(0, 120)}`);
    } finally {
      await browser.close().catch(() => undefined);
    }
    await new Promise((r) => setTimeout(r, 700));
  }

  const still = feed.listings.filter((l) => !sanitizeListingImages(l.images).length).length;
  console.info(`[details] done updated=${updated} stillEmpty=${still}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
