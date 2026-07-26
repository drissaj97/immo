import { readFileSync } from "fs";
import path from "path";
import type { RawPartnerListing } from "@/lib/aggregation/types";
import { fetchText, sleep } from "../http-client";
import {
  extractMubawabId,
  mapJsonLdToRawListing,
  normalizeMubawabUrl,
} from "../map-listing";
import { extractJsonLdBlocks, findRealEstateListing } from "../parse-json-ld";
import type { ScrapeOptions } from "../types";

const LISTING_PATH_PATTERN = /\/fr\/(?:a|pa)\/\d+[^"'\s<>]*/gi;

const SEARCH_SEEDS = [
  "https://www.mubawab.ma/fr/ct/casablanca/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/casablanca/immobilier-a-louer",
  "https://www.mubawab.ma/fr/ct/rabat/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/rabat/immobilier-a-louer",
  "https://www.mubawab.ma/fr/ct/marrakech/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/marrakech/immobilier-a-louer",
  "https://www.mubawab.ma/fr/ct/tanger/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/agadir/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/sal%C3%A9/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/k%C3%A9nitra/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/f%C3%A8s/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/mohammedia/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/t%C3%A9mara/immobilier-a-vendre",
  "https://www.mubawab.ma/fr/ct/bouskoura/immobilier-a-vendre",
];

export async function scrapeMubawab(options: ScrapeOptions = {}): Promise<{
  listings: RawPartnerListing[];
  errors: string[];
}> {
  const maxListings = options.maxListings ?? Number(process.env.SCRAPE_MAX_LISTINGS ?? 3000);
  const seedLimit = options.mubawabSeedLimit ?? Number(process.env.SCRAPE_MUBAWAB_SEED_LIMIT ?? 2000);
  const delayMs = options.delayMs ?? Number(process.env.SCRAPE_DELAY_MS ?? 120);
  const concurrency = Number(process.env.SCRAPE_MUBAWAB_CONCURRENCY ?? 6);

  const queue = [
    ...SEARCH_SEEDS,
    ...loadMubawabSeedUrls(seedLimit),
  ];
  const visited = new Set<string>();
  const listings: RawPartnerListing[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  // Découverte rapide via pages recherche
  for (const searchUrl of SEARCH_SEEDS) {
    try {
      const html = await fetchText(searchUrl);
      for (const related of extractRelatedListingUrls(html)) {
        if (!visited.has(related)) queue.push(related);
      }
      // pagination o=2..N
      for (let page = 2; page <= 15; page++) {
        try {
          const pageHtml = await fetchText(`${searchUrl}?o=${page}`);
          const found = extractRelatedListingUrls(pageHtml);
          if (!found.length) break;
          for (const related of found) {
            if (!visited.has(related)) queue.push(related);
          }
          await sleep(delayMs);
        } catch {
          break;
        }
      }
    } catch (err) {
      errors.push(`search ${searchUrl}: ${String(err)}`);
    }
    await sleep(delayMs);
  }

  console.info(`[mubawab] ${queue.length} URLs en file — concurrence ${concurrency}`);

  async function worker() {
    while (listings.length < maxListings) {
      const rawUrl = queue.shift();
      if (!rawUrl) return;

      const url = normalizeMubawabUrl(rawUrl);
      if (visited.has(url)) continue;
      visited.add(url);

      // Page listing (pas fiche) → extraire liens
      if (!/\/fr\/(?:a|pa)\/\d+/i.test(url)) {
        try {
          const html = await fetchText(url);
          for (const related of extractRelatedListingUrls(html)) {
            if (!visited.has(related) && queue.length < maxListings * 4) queue.push(related);
          }
        } catch (err) {
          errors.push(`${url}: ${String(err)}`);
        }
        await sleep(delayMs);
        continue;
      }

      const externalId = extractMubawabId(url);
      if (!externalId || seenIds.has(externalId)) continue;

      try {
        const html = await fetchText(url);
        const jsonLd = findRealEstateListing(extractJsonLdBlocks(html));
        if (!jsonLd) {
          errors.push(`no JSON-LD: ${url}`);
          continue;
        }

        const listing = mapJsonLdToRawListing(jsonLd, externalId, url);
        if (!listing) {
          errors.push(`invalid listing: ${url}`);
          continue;
        }

        listings.push(listing);
        seenIds.add(externalId);

        for (const related of extractRelatedListingUrls(html)) {
          if (!visited.has(related) && queue.length < maxListings * 4) {
            queue.push(related);
          }
        }
      } catch (err) {
        errors.push(`${url}: ${String(err)}`);
      }

      await sleep(delayMs);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  return { listings, errors: errors.slice(0, 80) };
}

function loadMubawabSeedUrls(limit: number): string[] {
  const catalogPath = path.join(process.cwd(), "src/lib/data/semsarai-listings.ts");
  try {
    const content = readFileSync(catalogPath, "utf-8");
    const urls = [...content.matchAll(/https:\/\/www\.mubawab\.ma[^"\s]+/g)].map((m) => m[0]);
    return [...new Set(urls)].slice(0, limit);
  } catch {
    return [
      "https://www.mubawab.ma/fr/a/8322586/vend-appartement-a-palmier-3-chambres-terrasse-et-ascenseur",
    ];
  }
}

function extractRelatedListingUrls(html: string): string[] {
  const matches = html.match(LISTING_PATH_PATTERN) ?? [];
  return [...new Set(matches.map((pathMatch) => normalizeMubawabUrl(pathMatch)))];
}
