#!/usr/bin/env tsx
/**
 * Backfill photos Avito en visitant les pages recherche quartier/catégorie
 * (moins de Cloudflare que les fiches détail une par une).
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { chromium } from "playwright";
import { extractAdsFromNextData, mapNextAdToListing } from "../src/lib/scraping/sources/avito-scraper";
import { sanitizeListingImages } from "../src/lib/media/listing-images";
import type { PartnerFeedFile } from "../src/lib/aggregation/types";

function areaCategoryFromUrl(url: string): { area: string; category: string } | null {
  const m = url.match(/avito\.ma\/fr\/([^/]+)\/([^/]+)\//i);
  if (!m) return null;
  return { area: m[1], category: m[2] };
}

async function main() {
  const feedPath = path.join(process.cwd(), "data/feeds/avito.json");
  const feed = JSON.parse(readFileSync(feedPath, "utf-8")) as PartnerFeedFile;

  const missing = feed.listings.filter((l) => !sanitizeListingImages(l.images).length && l.sourceUrl);
  const buckets = new Map<string, string[]>();
  for (const l of missing) {
    const ac = areaCategoryFromUrl(l.sourceUrl!);
    if (!ac) continue;
    const key = `${ac.area}/${ac.category}`;
    const ids = buckets.get(key) ?? [];
    ids.push(l.externalId);
    buckets.set(key, ids);
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1].length - a[1].length);
  const maxBuckets = Number(process.env.ENRICH_AVITO_BUCKETS ?? 40);
  console.info(`[search-enrich] ${missing.length} sans photo · ${sorted.length} pages · top ${maxBuckets}`);

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
  });

  let updated = 0;
  let pagesOk = 0;

  try {
    for (let i = 0; i < Math.min(sorted.length, maxBuckets); i++) {
      const [key, ids] = sorted[i]!;
      const [area, category] = key.split("/");
      const url = `https://www.avito.ma/fr/${area}/${category}`;

      // Nouveau contexte régulièrement pour limiter Cloudflare
      const context = await browser.newContext({
        locale: "fr-FR",
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        viewport: { width: 1365, height: 900 },
      });
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      });
      const page = await context.newPage();

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 40000 });
        await page.waitForTimeout(2800);
        let html = await page.content();
        let title = await page.title();
        if (/Just a moment|Un instant/i.test(title) && html.length < 120000) {
          await page.waitForTimeout(6000);
          html = await page.content();
          title = await page.title();
        }
        if (/Just a moment|Un instant/i.test(title) && html.length < 120000) {
          console.warn(`cf ${key}`);
          await context.close();
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }

        const ads = extractAdsFromNextData(html);
        const byId = new Map(ads.map((ad) => [String(ad.listId), ad]));
        let pageUpdates = 0;
        for (const id of ids) {
          const ad = byId.get(id);
          if (!ad) continue;
          const mapped = mapNextAdToListing(ad, area || "casablanca");
          const images = sanitizeListingImages(mapped?.images);
          if (!images.length) continue;
          const idx = feed.listings.findIndex((l) => l.externalId === id);
          if (idx < 0) continue;
          feed.listings[idx] = { ...feed.listings[idx]!, images };
          updated += 1;
          pageUpdates += 1;
        }
        pagesOk += 1;
        console.info(`ok ${key} ads=${ads.length} matched=+${pageUpdates} (total ${updated})`);
      } catch (err) {
        console.warn(`err ${key}: ${String(err).slice(0, 120)}`);
      } finally {
        await context.close();
      }

      if ((i + 1) % 5 === 0) {
        feed.syncedAt = new Date().toISOString();
        writeFileSync(feedPath, JSON.stringify(feed));
        console.info(`checkpoint pages=${i + 1} updated=${updated}`);
      }
      await new Promise((r) => setTimeout(r, 1200));
    }
  } finally {
    await browser.close();
  }

  feed.syncedAt = new Date().toISOString();
  writeFileSync(feedPath, JSON.stringify(feed));
  const still = feed.listings.filter((l) => !sanitizeListingImages(l.images).length).length;
  console.info(`[search-enrich] done pagesOk=${pagesOk} updated=${updated} stillEmpty=${still}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
