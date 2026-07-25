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

export async function scrapeMubawab(options: ScrapeOptions = {}): Promise<{
  listings: RawPartnerListing[];
  errors: string[];
}> {
  const maxListings = options.maxListings ?? Number(process.env.SCRAPE_MAX_LISTINGS ?? 500);
  const seedLimit = options.mubawabSeedLimit ?? Number(process.env.SCRAPE_MUBAWAB_SEED_LIMIT ?? 200);
  const delayMs = options.delayMs ?? Number(process.env.SCRAPE_DELAY_MS ?? 400);

  const queue = loadMubawabSeedUrls(seedLimit);
  const visited = new Set<string>();
  const listings: RawPartnerListing[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  while (queue.length > 0 && listings.length < maxListings) {
    const rawUrl = queue.shift();
    if (!rawUrl) break;

    const url = normalizeMubawabUrl(rawUrl);
    if (visited.has(url)) continue;
    visited.add(url);

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
        if (!visited.has(related) && queue.length < maxListings * 3) {
          queue.push(related);
        }
      }
    } catch (err) {
      errors.push(`${url}: ${String(err)}`);
    }

    await sleep(delayMs);
  }

  return { listings, errors };
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
      "https://www.mubawab.ma/fr/a/8180804/a-vendre-appartement-de-104-m2-el-qods",
    ];
  }
}

function extractRelatedListingUrls(html: string): string[] {
  const matches = html.match(LISTING_PATH_PATTERN) ?? [];
  return [...new Set(matches.map((pathMatch) => normalizeMubawabUrl(pathMatch)))];
}
