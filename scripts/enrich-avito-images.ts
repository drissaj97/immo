#!/usr/bin/env tsx
/**
 * Ré-extrait les photos Avito :
 * 1) pages recherche (__NEXT_DATA__)
 * 2) fiches détail sans photo (og:image)
 * Met à jour data/feeds/avito.json sans supprimer les annonces.
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { scrapeAvito } from "../src/lib/scraping/sources/avito-scraper";
import { extractAvitoImagesFromHtml } from "../src/lib/scraping/sources/avito-images";
import { normalizeAvitoImageUrl, sanitizeListingImages } from "../src/lib/media/listing-images";
import type { PartnerFeedFile, RawPartnerListing } from "../src/lib/aggregation/types";

async function enrichFromDetailPages(feed: PartnerFeedFile): Promise<number> {
  const missing = feed.listings.filter(
    (l) => !sanitizeListingImages(l.images).length && l.sourceUrl,
  );
  if (!missing.length) return 0;

  const limit = Number(process.env.ENRICH_AVITO_DETAIL_LIMIT ?? 150);
  const delayMs = Number(process.env.SCRAPE_DELAY_MS ?? 700);
  const targets = missing.slice(0, limit);

  console.info(`[enrich-avito] fiches détail sans photo: ${targets.length}/${missing.length}`);

  let playwright: typeof import("playwright");
  try {
    playwright = await import("playwright");
  } catch {
    console.warn("[enrich-avito] playwright indisponible pour les fiches détail");
    return 0;
  }

  const browser = await playwright.chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-blink-features=AutomationControlled"],
    proxy: process.env.SCRAPING_PROXY_URL
      ? { server: process.env.SCRAPING_PROXY_URL }
      : undefined,
  });

  let updated = 0;
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

    for (let i = 0; i < targets.length; i++) {
      const listing = targets[i]!;
      try {
        await page.goto(listing.sourceUrl!, { waitUntil: "domcontentloaded", timeout: 40000 });
        await page.waitForTimeout(1800);
        const html = await page.content();
        const title = await page.title();
        if (/Just a moment|Un instant/i.test(title) && html.length < 100000) {
          console.warn(`[enrich-avito] Cloudflare détail ${listing.externalId}`);
          await page.waitForTimeout(4000);
          continue;
        }
        const images = extractAvitoImagesFromHtml(html);
        if (!images.length) continue;

        const idx = feed.listings.findIndex((l) => l.externalId === listing.externalId);
        if (idx >= 0) {
          feed.listings[idx] = { ...feed.listings[idx]!, images };
          updated += 1;
        }
        if ((i + 1) % 10 === 0) {
          console.info(`[enrich-avito] détail ${i + 1}/${targets.length} — photos +${updated}`);
        }
      } catch (err) {
        console.warn(`[enrich-avito] détail ${listing.externalId}: ${String(err).slice(0, 120)}`);
      }
      await page.waitForTimeout(delayMs);
    }
  } finally {
    await browser.close();
  }

  return updated;
}

async function main() {
  const feedPath = path.join(process.cwd(), "data/feeds/avito.json");
  const feed = JSON.parse(readFileSync(feedPath, "utf-8")) as PartnerFeedFile;
  const beforeEmpty = feed.listings.filter((l) => !sanitizeListingImages(l.images).length).length;

  console.info(
    `[enrich-avito] ${feed.listings.length} annonces, ${beforeEmpty} sans photo — scraping recherche…`,
  );

  const { listings: scraped, errors } = await scrapeAvito({
    maxListings: Number(process.env.SCRAPE_MAX_LISTINGS ?? 2000),
    maxPages: Number(process.env.SCRAPE_AVITO_MAX_PAGES ?? 4),
  });

  const byId = new Map<string, RawPartnerListing>();
  for (const l of scraped) byId.set(l.externalId, l);

  let updated = 0;
  feed.listings = feed.listings.map((listing) => {
    const existing = sanitizeListingImages(listing.images);
    const fresh = byId.get(listing.externalId);
    const freshImages = sanitizeListingImages(
      (fresh?.images ?? []).map((u) => normalizeAvitoImageUrl(u)),
    );
    if (freshImages.length && (existing.length === 0 || freshImages[0] !== existing[0])) {
      updated += 1;
      return { ...listing, images: freshImages.slice(0, 8) };
    }
    return { ...listing, images: existing };
  });

  let added = 0;
  const known = new Set(feed.listings.map((l) => l.externalId));
  for (const l of scraped) {
    if (known.has(l.externalId)) continue;
    const images = sanitizeListingImages((l.images ?? []).map(normalizeAvitoImageUrl));
    feed.listings.push({ ...l, images });
    known.add(l.externalId);
    added += 1;
  }

  const fromDetails = await enrichFromDetailPages(feed);
  updated += fromDetails;

  const stillEmpty = feed.listings.filter((l) => !sanitizeListingImages(l.images).length).length;
  feed.syncedAt = new Date().toISOString();
  writeFileSync(feedPath, JSON.stringify(feed));

  console.info(
    `[enrich-avito] photos MAJ: ${updated} · nouvelles: ${added} · encore sans photo: ${stillEmpty}`,
  );
  if (errors.length) {
    console.info(`[enrich-avito] erreurs recherche: ${errors.slice(0, 5).join(" | ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
