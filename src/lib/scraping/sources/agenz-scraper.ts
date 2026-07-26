import { readFileSync } from "fs";
import path from "path";
import type { RawPartnerListing } from "@/lib/aggregation/types";
import { mapPool } from "../concurrency";
import { fetchText } from "../http-client";
import {
  capitalizeWords,
  extractBathrooms,
  extractBedrooms,
  extractDescription,
  extractSurfaceM2,
  extractTitle,
  parseAstroIslandProps,
  parseMadPrice,
} from "../html-utils";
import { inferTransactionType } from "../map-listing";
import { maybeSleep, resolveConcurrency, resolveDelayMs } from "../scrape-config";
import type { ScrapeOptions } from "../types";

// Ne pas utiliser (?!\/video) après \d+ : le moteur backtrack et coupe l'id (450345 → 45034).
const LISTING_PATH_RE =
  /\/fr\/annonces\/immo-([^/]+)\/((?:vente|location)-[^/]+)\/([^/]+)\/(\d+)(?:\/video)?(?=["'#?\s>]|$)/gi;

const SEARCH_SEEDS = [
  "https://agenz.ma/fr/acheter/immo-casablanca/vente-appartements",
  "https://agenz.ma/fr/acheter/immo-casablanca/vente-villas",
  "https://agenz.ma/fr/louer/immo-casablanca/location-appartements",
  "https://agenz.ma/fr/acheter/immo-rabat/vente-appartements",
  "https://agenz.ma/fr/louer/immo-rabat/location-appartements",
  "https://agenz.ma/fr/acheter/immo-marrakech/vente-appartements",
  "https://agenz.ma/fr/acheter/immo-tanger/vente-appartements",
  "https://agenz.ma/fr/acheter/immo-agadir/vente-appartements",
  "https://agenz.ma/fr/acheter/immo-sale/vente-appartements",
  "https://agenz.ma/fr/acheter/immo-kenitra/vente-appartements",
  "https://agenz.ma/fr/acheter/immo-fes/vente-appartements",
  "https://agenz.ma/fr/acheter/immo-mohammadia/vente-appartements",
  "https://agenz.ma/fr/acheter/immo-bouskoura/vente-appartements",
  "https://agenz.ma/fr/acheter/immo-dar-bouazza/vente-appartements",
];

export async function scrapeAgenz(options: ScrapeOptions = {}): Promise<{
  listings: RawPartnerListing[];
  errors: string[];
}> {
  const maxListings = options.maxListings ?? Number(process.env.SCRAPE_MAX_LISTINGS ?? 3000);
  const delayMs = resolveDelayMs(options.delayMs);
  const concurrency = resolveConcurrency("SCRAPE_AGENZ_CONCURRENCY", 32, 8);
  const searchConcurrency = resolveConcurrency("SCRAPE_SEARCH_CONCURRENCY", 20, 6);
  const maxPages = options.maxPages ?? Number(process.env.SCRAPE_AGENZ_MAX_PAGES ?? 12);

  const errors: string[] = [];
  const searchJobs = SEARCH_SEEDS.flatMap((seed) =>
    Array.from({ length: maxPages }, (_, i) => ({
      url: i === 0 ? seed : `${seed}?page=${i + 1}`,
      page: i + 1,
      seed,
    })),
  );

  const fromSearchNested = await mapPool(searchJobs, searchConcurrency, async (job) => {
    try {
      const html = await fetchText(job.url);
      const found = extractAgenzListingUrls(html);
      await maybeSleep(delayMs);
      return found;
    } catch (err) {
      if (job.page === 1) errors.push(`search ${job.seed}: ${String(err)}`);
      return [] as string[];
    }
  });

  const queue = [...new Set([...fromSearchNested.flat(), ...loadAgenzSeedUrls(800)])].slice(
    0,
    maxListings * 2,
  );
  console.info(`[agenz] ${queue.length} fiches — concurrence ${concurrency} (delay ${delayMs}ms)`);

  const listings: RawPartnerListing[] = [];
  const seen = new Set<string>();

  await mapPool(queue, concurrency, async (url) => {
    if (listings.length >= maxListings) return;
    const id = extractAgenzId(url);
    if (!id || seen.has(id)) return;
    seen.add(id); // réserve avant fetch — évite double hit en concurrence

    try {
      const html = await fetchText(url);
      const listing = parseAgenzDetail(html, url);
      if (!listing) {
        errors.push(`invalid: ${url}`);
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

export function extractAgenzListingUrls(html: string): string[] {
  const urls: string[] = [];
  for (const match of html.matchAll(LISTING_PATH_RE)) {
    const [, city, kind, neighborhood, id] = match;
    urls.push(`https://agenz.ma/fr/annonces/immo-${city}/${kind}/${neighborhood}/${id}`);
  }
  return [...new Set(urls)];
}

export function extractAgenzId(url: string): string | null {
  const match = url.match(/\/(\d+)(?:\/video)?\/?$/i);
  return match?.[1] ?? null;
}

export function parseAgenzDetail(html: string, url: string): RawPartnerListing | null {
  const props = parseAstroIslandProps(html, "prixString");
  if (props?.vendu === true) return null;

  const pathParts = parseAgenzPath(url);
  const title =
    (typeof props?.alt === "string" && props.alt) ||
    extractTitle(html) ||
    "";
  if (!title || isAgenzIndexTitle(title)) return null;

  const priceAttr = html.match(/\bprice="(\d+)"/i)?.[1];
  const prixString = typeof props?.prixString === "string" ? props.prixString : undefined;
  const priceFromStructured = parseMadPrice(priceAttr ?? prixString);
  const priceFromTitle = extractPriceWithCurrency(title);
  const price = priceFromStructured || priceFromTitle;
  if (price <= 0) return null;

  const description =
    extractDescription(html) ||
    (typeof props?.message === "string" ? props.message : undefined) ||
    title;

  const surface =
    (typeof props?.surface === "number" ? props.surface : undefined) ??
    extractSurfaceM2(`${title} ${description}`);
  const bedrooms =
    (typeof props?.typologie === "number" ? props.typologie : undefined) ??
    extractBedrooms(`${title} ${description}`);
  const bathrooms =
    (typeof props?.sdb === "number" ? props.sdb : undefined) ??
    extractBathrooms(description);

  const images = normalizeAgenzImages(props?.images, html);
  if (!images.length && !props) return null;

  const city = pathParts?.city ?? "Maroc";
  const neighborhood = pathParts?.neighborhood ?? city;
  const listingType = inferAgenzListingType(
    typeof props?.type === "string" ? props.type : undefined,
    pathParts?.kind,
    title,
  );
  const transactionHint =
    typeof props?.transaction_type === "string"
      ? props.transaction_type
      : pathParts?.kind ?? "";

  return {
    externalId: pathParts?.id ?? extractAgenzId(url) ?? String(price),
    title: title.trim(),
    description: description.slice(0, 2000),
    price,
    currency: "MAD",
    transactionType: inferTransactionType(
      `${title} ${transactionHint}`,
      url,
      price,
      listingType,
    ),
    listingType,
    city,
    neighborhood,
    livingArea: surface,
    bedrooms,
    bathrooms,
    images,
    sourceUrl: url.split("?")[0].replace(/\/video\/?$/, ""),
    advertiserName: "Agenz.ma",
    phone: sanitizePortalPhone(
      (typeof props?.phone === "string" && props.phone) ||
        (typeof props?.callPhone === "string" && props.callPhone) ||
        undefined,
    ),
  };
}

function isAgenzIndexTitle(title: string): boolean {
  return /^\d+\s+appartements?\s+à/i.test(title.trim()) || /\bagenz\s*$/i.test(title.trim());
}

function extractPriceWithCurrency(text: string): number {
  const match = text.match(/([\d\s.,]{3,})\s*(?:DH|Dh|dh|MAD|Dhs)\b/);
  return match ? parseMadPrice(match[1]) : 0;
}

function sanitizePortalPhone(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^U2FsdGVkX/i.test(trimmed)) return undefined;
  if (!/^\+?\d[\d\s-]{7,}$/.test(trimmed)) return undefined;
  return trimmed.replace(/\s+/g, "");
}

function parseAgenzPath(url: string): {
  city: string;
  kind: string;
  neighborhood: string;
  id: string;
} | null {
  const match = url.match(
    /\/fr\/annonces\/immo-([^/]+)\/((?:vente|location)-[^/]+)\/([^/]+)\/(\d+)/i,
  );
  if (!match) return null;
  return {
    city: capitalizeWords(match[1].replace(/^immo-/, "")),
    kind: match[2],
    neighborhood: capitalizeWords(match[3]),
    id: match[4],
  };
}

function normalizeAgenzImages(images: unknown, html: string): string[] {
  const fromProps = Array.isArray(images)
    ? images.filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
    : [];
  const fromHtml = [
    ...html.matchAll(
      /https:\/\/(?:media\.agenz\.ma|listings-media-uploads\.s3\.amazonaws\.com)\/images\/[^"'\\\s?]+/gi,
    ),
  ].map((m) => m[0]);

  const preferred = (fromProps.length ? fromProps : fromHtml).map((url) =>
    url
      .replace("https://listings-media-uploads.s3.amazonaws.com/", "https://media.agenz.ma/")
      .split("?")[0],
  );
  return [...new Set(preferred)].slice(0, 20);
}

function inferAgenzListingType(
  type: string | undefined,
  kind: string | undefined,
  title: string,
): RawPartnerListing["listingType"] {
  const text = `${type ?? ""} ${kind ?? ""} ${title}`.toLowerCase();
  if (text.includes("terrain") || text.includes("land")) return "land";
  if (text.includes("bureau") || text.includes("local") || text.includes("commercial")) {
    return "commercial";
  }
  if (text.includes("villa")) return "villa";
  if (text.includes("riad") || text.includes("maison")) return text.includes("riad") ? "riad" : "villa";
  return "apartment";
}

function loadAgenzSeedUrls(limit: number): string[] {
  const catalogPath = path.join(process.cwd(), "src/lib/data/semsarai-listings.ts");
  try {
    const content = readFileSync(catalogPath, "utf-8");
    const urls = [...content.matchAll(/https:\/\/(?:www\.)?agenz\.ma\/fr\/annonces\/[^"'\s]+/g)].map(
      (m) => m[0].replace(/\/video\/?$/, ""),
    );
    return [...new Set(urls)].slice(0, limit);
  } catch {
    return [];
  }
}
