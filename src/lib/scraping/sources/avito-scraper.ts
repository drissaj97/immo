import type { RawPartnerListing } from "@/lib/aggregation/types";
import { normalizeAvitoImageUrl, sanitizeListingImages } from "@/lib/media/listing-images";
import { sleep } from "../http-client";
import { extractAvitoId } from "../map-listing";
import type { ScrapeOptions } from "../types";

const DEFAULT_CITIES = [
  "casablanca",
  "rabat",
  "marrakech",
  "tanger",
  "agadir",
  "fes",
  "kenitra",
  "sale",
  "mohammedia",
  "temara",
  "bouskoura",
];

const CATEGORIES = [
  "immobilier",
  "appartements",
  "villas_et_riads",
  "terrains_et_fermes",
  "magasins_et_commerces",
];

type PlaywrightModule = typeof import("playwright");

type AvitoNextAd = {
  listId?: string | number;
  subject?: string;
  description?: string;
  href?: string;
  defaultImage?: string;
  images?: string[];
  location?: string;
  price?: { value?: number; currency?: string };
  adType?: { key?: string; label?: string };
  category?: { name?: string; formatted?: string };
  params?: {
    secondary?: Array<{ key?: string; value?: string | number }>;
  };
};

/**
 * Scraping Avito via __NEXT_DATA__ (photos + métadonnées fiables).
 * Multi-catégories + nouveau contexte navigateur par ville.
 */
export async function scrapeAvito(options: ScrapeOptions = {}): Promise<{
  listings: RawPartnerListing[];
  errors: string[];
}> {
  const maxListings = options.maxListings ?? Number(process.env.SCRAPE_MAX_LISTINGS ?? 1500);
  const maxPages = options.maxPages ?? Number(process.env.SCRAPE_AVITO_MAX_PAGES ?? 2);
  const delayMs = options.delayMs ?? Number(process.env.SCRAPE_DELAY_MS ?? 400);
  const cities = (process.env.SCRAPE_AVITO_CITIES ?? DEFAULT_CITIES.join(","))
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const listings: RawPartnerListing[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  let playwright: PlaywrightModule;
  try {
    playwright = await import("playwright");
  } catch {
    return {
      listings: [],
      errors: ["playwright non installé — pnpm add -D playwright && npx playwright install chromium"],
    };
  }

  for (const city of cities) {
    if (listings.length >= maxListings) break;

    const browser = await playwright.chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled", "--no-sandbox", "--disable-dev-shm-usage"],
      proxy: process.env.SCRAPING_PROXY_URL
        ? { server: process.env.SCRAPING_PROXY_URL }
        : undefined,
    });

    try {
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

      for (const category of CATEGORIES) {
        if (listings.length >= maxListings) break;

        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          if (listings.length >= maxListings) break;

          const searchUrl =
            pageNum === 1
              ? `https://www.avito.ma/fr/${city}/${category}`
              : `https://www.avito.ma/fr/${city}/${category}?o=${pageNum}`;

          try {
            await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 35000 });
            await page.waitForTimeout(2500);

            let html = await page.content();
            let pageTitle = await page.title();
            if (/Un instant|Just a moment|security verification/i.test(`${html}\n${pageTitle}`) && html.length < 100000) {
              await page.waitForTimeout(5000);
              html = await page.content();
              pageTitle = await page.title();
              if (/Un instant|Just a moment|security verification/i.test(`${html}\n${pageTitle}`) && html.length < 100000) {
                errors.push(`Cloudflare ${city}/${category} p${pageNum}`);
                break;
              }
            }

            const ads = extractAdsFromNextData(html);
            if (!ads.length) {
              // page vide ou structure changée
              if (pageNum === 1) errors.push(`Aucune annonce NEXT_DATA ${city}/${category} p${pageNum}`);
              break;
            }

            let added = 0;
            for (const ad of ads) {
              if (listings.length >= maxListings) break;
              const listing = mapNextAdToListing(ad, city);
              if (!listing || seenIds.has(listing.externalId)) continue;
              seenIds.add(listing.externalId);
              listings.push(listing);
              added += 1;
            }

            console.info(`[avito] ${city}/${category} p${pageNum} — +${added} (total ${listings.length})`);
          } catch (err) {
            errors.push(`${city}/${category} p${pageNum}: ${String(err)}`);
            break;
          }

          await sleep(delayMs);
        }
      }
    } finally {
      await browser.close();
    }

    await sleep(delayMs * 2);
  }

  return { listings, errors: errors.slice(0, 100) };
}

/** Parse les annonces depuis le JSON embarqué Next.js (inclut defaultImage / images). */
export function extractAdsFromNextData(html: string): AvitoNextAd[] {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) return [];

  try {
    const data = JSON.parse(match[1]) as {
      props?: {
        pageProps?: {
          componentProps?: { ads?: { ads?: AvitoNextAd[] } };
          initialReduxState?: { ad?: { search?: { ads?: { ads?: AvitoNextAd[] } } } };
        };
      };
    };
    const primary = data.props?.pageProps?.componentProps?.ads?.ads;
    if (Array.isArray(primary) && primary.length) return primary;

    const redux = data.props?.pageProps?.initialReduxState?.ad?.search?.ads?.ads;
    if (Array.isArray(redux) && redux.length) return redux;
  } catch {
    return [];
  }
  return [];
}

export function mapNextAdToListing(ad: AvitoNextAd, citySlug: string): RawPartnerListing | null {
  const externalId = String(ad.listId ?? extractAvitoId(ad.href ?? "") ?? "").trim();
  if (!externalId) return null;

  const title = (ad.subject ?? "").trim();
  if (!title) return null;

  const price = Number(ad.price?.value ?? 0);
  if (!Number.isFinite(price) || price < 500) return null;

  const locParts = (ad.location ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const city = locParts[0] || capitalize(citySlug.replace(/_/g, " "));
  const neighborhood = locParts[1] || city;

  const secondary = ad.params?.secondary ?? [];
  const bedrooms = paramNumber(secondary, "rooms");
  const bathrooms = paramNumber(secondary, "bathrooms");
  const livingArea = paramNumber(secondary, "size");

  const rawImages = [
    ...(ad.images ?? []),
    ...(ad.defaultImage ? [ad.defaultImage] : []),
  ];
  const images = sanitizeListingImages(rawImages.map(normalizeAvitoImageUrl)).slice(0, 8);

  const href = ad.href?.startsWith("http")
    ? ad.href
    : ad.href
      ? `https://www.avito.ma${ad.href}`
      : `https://www.avito.ma/fr/${citySlug}/immobilier/annonce_${externalId}.htm`;

  const typeHint = `${title} ${ad.category?.name ?? ""} ${ad.category?.formatted ?? ""} ${href}`;
  const rent =
    ad.adType?.key === "RENT" ||
    /louer|location|rent/i.test(ad.adType?.label ?? "") ||
    /à louer|location/i.test(title);

  return {
    externalId,
    title,
    description: (ad.description ?? title).slice(0, 2000),
    price,
    currency: "MAD",
    transactionType: rent ? "long_term_rent" : "sale",
    listingType: inferType(typeHint),
    city,
    neighborhood,
    bedrooms,
    bathrooms,
    livingArea,
    images,
    sourceUrl: href.split("?")[0],
  };
}

function paramNumber(
  secondary: Array<{ key?: string; value?: string | number }>,
  key: string,
): number | undefined {
  const row = secondary.find((p) => p.key === key);
  if (row?.value === undefined || row.value === null) return undefined;
  const n = Number(row.value);
  return Number.isFinite(n) ? n : undefined;
}

function inferType(text: string): RawPartnerListing["listingType"] {
  const t = text.toLowerCase();
  if (t.includes("terrain")) return "land";
  if (t.includes("villa") || t.includes("riad")) return t.includes("riad") ? "riad" : "villa";
  if (t.includes("local") || t.includes("bureau") || t.includes("commercial") || t.includes("magasin")) {
    return "commercial";
  }
  return "apartment";
}

function capitalize(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
