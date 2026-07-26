import { readFileSync } from "fs";
import path from "path";
import type { RawPartnerListing } from "@/lib/aggregation/types";
import { mapPool } from "../concurrency";
import { fetchText } from "../http-client";
import {
  extractMubawabId,
  mapJsonLdToRawListing,
  normalizeMubawabUrl,
} from "../map-listing";
import { extractJsonLdBlocks, findRealEstateListing } from "../parse-json-ld";
import { maybeSleep, resolveConcurrency, resolveDelayMs } from "../scrape-config";
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
  const delayMs = resolveDelayMs(options.delayMs);
  const concurrency = resolveConcurrency("SCRAPE_MUBAWAB_CONCURRENCY", 28, 6);
  const searchConcurrency = resolveConcurrency("SCRAPE_SEARCH_CONCURRENCY", 20, 6);
  const maxSearchPages = Number(process.env.SCRAPE_MUBAWAB_MAX_PAGES ?? 15);

  const errors: string[] = [];
  const searchJobs = SEARCH_SEEDS.flatMap((seed) =>
    Array.from({ length: maxSearchPages }, (_, i) => ({
      url: i === 0 ? seed : `${seed}?o=${i + 1}`,
      page: i + 1,
    })),
  );

  const discovered = await mapPool(searchJobs, searchConcurrency, async (job) => {
    try {
      const html = await fetchText(job.url);
      const found = extractRelatedListingUrls(html);
      await maybeSleep(delayMs);
      return found;
    } catch (err) {
      if (job.page === 1) errors.push(`search ${job.url}: ${String(err)}`);
      return [] as string[];
    }
  });

  const queue = [
    ...new Set([...discovered.flat(), ...loadMubawabSeedUrls(seedLimit)]),
  ].slice(0, maxListings * 3);

  console.info(`[mubawab] ${queue.length} URLs — concurrence ${concurrency} (delay ${delayMs}ms)`);

  const listings: RawPartnerListing[] = [];
  const seenIds = new Set<string>();

  await mapPool(queue, concurrency, async (rawUrl) => {
    if (listings.length >= maxListings) return;
    const url = normalizeMubawabUrl(rawUrl);
    if (!/\/fr\/(?:a|pa)\/\d+/i.test(url)) return;

    const externalId = extractMubawabId(url);
    if (!externalId || seenIds.has(externalId)) return;
    seenIds.add(externalId);

    try {
      const html = await fetchText(url);
      const jsonLd = findRealEstateListing(extractJsonLdBlocks(html));
      if (!jsonLd) {
        errors.push(`no JSON-LD: ${url}`);
        return;
      }

      const listing = mapJsonLdToRawListing(jsonLd, externalId, url);
      if (!listing) {
        errors.push(`invalid listing: ${url}`);
        return;
      }

      if (listings.length < maxListings) listings.push(listing);
    } catch (err) {
      errors.push(`${url}: ${String(err)}`);
    }

    await maybeSleep(delayMs);
  });

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
