import { readFileSync } from "fs";
import path from "path";
import type { RawPartnerListing } from "@/lib/aggregation/types";
import { mapPool } from "../concurrency";
import { fetchText, sleep } from "../http-client";
import {
  capitalizeWords,
  decodeHtmlEntities,
  extractBathrooms,
  extractBedrooms,
  extractDescription,
  extractSurfaceM2,
  extractTitle,
  parseMadPrice,
} from "../html-utils";
import { inferTransactionType } from "../map-listing";
import type { ScrapeOptions } from "../types";

const LISTING_PATH_RE =
  /\/fr-ma\/((?:acheter|louer)-[a-z0-9-]+-[a-z]{2}\d{4,})(?:["'#?]|$)/gi;

const SEARCH_SEEDS = [
  "https://www.yakeey.com/fr-ma/acheter/casablanca/appartement",
  "https://www.yakeey.com/fr-ma/acheter/casablanca/villa",
  "https://www.yakeey.com/fr-ma/louer/casablanca/appartement",
  "https://www.yakeey.com/fr-ma/acheter/rabat/appartement",
  "https://www.yakeey.com/fr-ma/louer/rabat/appartement",
  "https://www.yakeey.com/fr-ma/acheter/marrakech/appartement",
  "https://www.yakeey.com/fr-ma/acheter/tanger/appartement",
  "https://www.yakeey.com/fr-ma/acheter/agadir/appartement",
  "https://www.yakeey.com/fr-ma/acheter/sale/appartement",
  "https://www.yakeey.com/fr-ma/acheter/kenitra/appartement",
  "https://www.yakeey.com/fr-ma/acheter/fes/appartement",
  "https://www.yakeey.com/fr-ma/acheter/dar-bouazza/appartement",
  "https://www.yakeey.com/fr-ma/acheter/bouskoura/appartement",
];

export async function scrapeYakeey(options: ScrapeOptions = {}): Promise<{
  listings: RawPartnerListing[];
  errors: string[];
}> {
  const maxListings = options.maxListings ?? Number(process.env.SCRAPE_MAX_LISTINGS ?? 3000);
  const delayMs = options.delayMs ?? Number(process.env.SCRAPE_DELAY_MS ?? 80);
  const concurrency = Number(process.env.SCRAPE_YAKEEY_CONCURRENCY ?? 8);
  const maxPages = options.maxPages ?? Number(process.env.SCRAPE_YAKEEY_MAX_PAGES ?? 10);

  const fromSearch: string[] = [];
  const errors: string[] = [];

  for (const seed of SEARCH_SEEDS) {
    try {
      for (let page = 1; page <= maxPages; page++) {
        const pageUrl = page === 1 ? seed : `${seed}?page=${page}`;
        const html = await fetchText(pageUrl);
        const found = extractYakeeyListingUrls(html);
        if (!found.length && page > 1) break;
        fromSearch.push(...found);
        await sleep(delayMs);
      }
    } catch (err) {
      errors.push(`search ${seed}: ${String(err)}`);
    }
  }

  // Priorité aux URLs fraîches (recherche) — les seeds SEMSAR peuvent être 404.
  const queue = [...new Set([...fromSearch, ...loadYakeeySeedUrls(600)])].slice(
    0,
    maxListings * 2,
  );
  console.info(`[yakeey] ${queue.length} fiches — concurrence ${concurrency}`);

  const listings: RawPartnerListing[] = [];
  const seen = new Set<string>();

  await mapPool(queue, concurrency, async (rawUrl) => {
    if (listings.length >= maxListings) return;
    const url = normalizeYakeeyUrl(rawUrl);
    const id = extractYakeeyId(url);
    if (!id || seen.has(id)) return;

    try {
      const html = await fetchText(url);
      const listing = parseYakeeyDetail(html, url);
      if (!listing) {
        errors.push(`invalid: ${url}`);
        return;
      }
      if (seen.has(listing.externalId)) return;
      seen.add(listing.externalId);
      if (listings.length < maxListings) listings.push(listing);
    } catch (err) {
      errors.push(`${url}: ${String(err)}`);
    }

    if (delayMs > 0) await sleep(delayMs);
  });

  return { listings, errors: errors.slice(0, 80) };
}

export function extractYakeeyListingUrls(html: string): string[] {
  const decoded = decodeHtmlEntities(html);
  const urls: string[] = [];
  for (const match of decoded.matchAll(LISTING_PATH_RE)) {
    const slug = match[1];
    if (!slug || slug.includes("mon-bien") || slug.includes("simulation")) continue;
    urls.push(normalizeYakeeyUrl(`https://www.yakeey.com/fr-ma/${slug}`));
  }
  return [...new Set(urls)];
}

/** Canonique : www + id en minuscules (les seeds SEMSAR ont souvent NI088704 / yakeey.com). */
export function normalizeYakeeyUrl(url: string): string {
  try {
    const u = new URL(url.replace("https://yakeey.com", "https://www.yakeey.com"));
    u.hostname = "www.yakeey.com";
    u.hash = "";
    u.search = "";
    u.pathname = u.pathname.replace(/-([a-z]{2}\d{4,})$/i, (_, id: string) => `-${id.toLowerCase()}`);
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function extractYakeeyId(url: string): string | null {
  const match = url.match(/-([a-z]{2}\d{4,})(?:[#?]|$)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

export function parseYakeeyDetail(html: string, url: string): RawPartnerListing | null {
  const title = extractTitle(html) ?? "";
  const description = extractDescription(html) ?? title;
  const pathInfo = parseYakeeyPath(url);

  const rscPrice = extractRscNumber(html, "salePrice") ?? extractRscNumber(html, '"price"');
  const price = rscPrice || parseMadPrice(title) || parseMadPrice(description);
  if (!title || price <= 0) return null;

  const city =
    extractRscString(html, "citySlug") ??
    pathInfo?.city ??
    "Maroc";
  const neighborhood =
    extractRscString(html, "neighborhoodSlug") ??
    pathInfo?.neighborhood ??
    city;

  const surface = extractSurfaceM2(`${title} ${description}`);
  const bedrooms = extractBedrooms(`${title} ${description}`);
  const bathrooms = extractBathrooms(description);
  const listingType = inferYakeeyListingType(pathInfo?.typeSlug, title);
  const images = extractYakeeyImages(html, pathInfo?.id);

  return {
    externalId: pathInfo?.id ?? extractYakeeyId(url) ?? String(price),
    title: title.trim(),
    description: description.slice(0, 2000),
    price,
    currency: "MAD",
    transactionType: inferTransactionType(
      `${title} ${pathInfo?.transaction ?? ""}`,
      url,
      price,
      listingType,
    ),
    listingType,
    city: capitalizeWords(city),
    neighborhood: capitalizeWords(neighborhood),
    livingArea: surface,
    bedrooms,
    bathrooms,
    images,
    sourceUrl: url.split("#")[0].split("?")[0],
    advertiserName: "Yakeey",
    phone: extractPhone(html),
  };
}

function parseYakeeyPath(url: string): {
  transaction: string;
  typeSlug: string;
  city: string;
  neighborhood: string;
  id: string;
} | null {
  const slug = url.match(/\/fr-ma\/([^?#]+)/i)?.[1];
  if (!slug) return null;
  const idMatch = slug.match(/-([a-z]{2}\d{4,})$/i);
  if (!idMatch) return null;
  const id = idMatch[1].toLowerCase();
  const body = slug.slice(0, -(id.length + 1));
  const parts = body.split("-");
  if (parts.length < 3) return null;
  const transaction = parts[0];
  // acheter-appartement-casablanca-maarif  OR acheter-local-commercial-marrakech-douar-lkoudia
  const typeTokens: string[] = [];
  let i = 1;
  const typeHints = new Set([
    "appartement",
    "villa",
    "maison",
    "riad",
    "terrain",
    "local",
    "commercial",
    "bureau",
    "duplex",
    "studio",
  ]);
  while (i < parts.length && typeHints.has(parts[i])) {
    typeTokens.push(parts[i]);
    i++;
  }
  if (!typeTokens.length && i < parts.length) {
    typeTokens.push(parts[i++]);
  }
  const city = parts[i] ?? "maroc";
  const neighborhood = parts.slice(i + 1).join("-") || city;
  return {
    transaction,
    typeSlug: typeTokens.join("-"),
    city,
    neighborhood,
    id,
  };
}

function inferYakeeyListingType(
  typeSlug: string | undefined,
  title: string,
): RawPartnerListing["listingType"] {
  const text = `${typeSlug ?? ""} ${title}`.toLowerCase();
  if (text.includes("terrain")) return "land";
  if (text.includes("commercial") || text.includes("bureau") || text.includes("local")) {
    return "commercial";
  }
  if (text.includes("villa") || text.includes("maison")) return "villa";
  if (text.includes("riad")) return "riad";
  return "apartment";
}

function extractYakeeyImages(html: string, externalId?: string): string[] {
  const id = externalId?.toLowerCase();
  const urls = [
    ...html.matchAll(/https:\/\/medias\.yakeey\.com\/[^"'\\\s]+/gi),
  ].map((m) => m[0].split("?")[0]);

  const preferred = urls
    .filter((u) => !u.includes("logo") && (id ? u.toLowerCase().includes(`/${id}/`) : true))
    .map((u) => {
      // Prefer full-size CDN path without crop params when possible
      const bare = u.replace(/\/cdn-cgi\/image\/[^/]+\//, "/cdn-cgi/image/format=auto/");
      return bare;
    });

  return [...new Set(preferred)].slice(0, 20);
}

function extractRscNumber(html: string, key: string): number | undefined {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${k}\\\\?"\\s*:\\s*(\\d+)`);
  const match = html.match(re);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function extractRscString(html: string, key: string): string | undefined {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`${k}\\\\?"\\s*:\\s*\\\\?"([^"\\\\]+)`);
  const match = html.match(re);
  return match?.[1] ? decodeHtmlEntities(match[1]) : undefined;
}

function extractPhone(html: string): string | undefined {
  const match = html.match(/\+212[\d\s-]{8,14}/);
  return match?.[0]?.replace(/\s+/g, "") || undefined;
}

function loadYakeeySeedUrls(limit: number): string[] {
  const catalogPath = path.join(process.cwd(), "src/lib/data/semsarai-listings.ts");
  try {
    const content = readFileSync(catalogPath, "utf-8");
    const urls = [
      ...content.matchAll(/https:\/\/(?:www\.)?yakeey\.com\/fr-ma\/[^"'\s]+/gi),
    ].map((m) => normalizeYakeeyUrl(m[0]));
    return [...new Set(urls)].slice(0, limit);
  } catch {
    return [];
  }
}
