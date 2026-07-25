import type { RawPartnerListing } from "@/lib/aggregation/types";
import { sleep } from "../http-client";
import { extractAvitoId, mapJsonLdToRawListing } from "../map-listing";
import { extractJsonLdBlocks, findRealEstateListing } from "../parse-json-ld";
import type { ScrapeOptions } from "../types";

const DEFAULT_CITIES = [
  "casablanca",
  "rabat",
  "marrakech",
  "tanger",
  "agadir",
  "fes",
  "kenitra",
];

type PlaywrightModule = typeof import("playwright");

export async function scrapeAvito(options: ScrapeOptions = {}): Promise<{
  listings: RawPartnerListing[];
  errors: string[];
}> {
  const maxListings = options.maxListings ?? Number(process.env.SCRAPE_MAX_LISTINGS ?? 200);
  const maxPages = options.maxPages ?? Number(process.env.SCRAPE_AVITO_MAX_PAGES ?? 3);
  const delayMs = options.delayMs ?? Number(process.env.SCRAPE_DELAY_MS ?? 800);
  const cities = (process.env.SCRAPE_AVITO_CITIES ?? DEFAULT_CITIES.join(",")).split(",");

  const listings: RawPartnerListing[] = [];
  const errors: string[] = [];
  const seenIds = new Set<string>();

  let playwright: PlaywrightModule;
  try {
    playwright = await import("playwright");
  } catch {
    return {
      listings: [],
      errors: ["playwright non installé — exécutez: pnpm add -D playwright && npx playwright install chromium"],
    };
  }

  const browser = await playwright.chromium.launch({
    headless: true,
    proxy: process.env.SCRAPING_PROXY_URL
      ? { server: process.env.SCRAPING_PROXY_URL }
      : undefined,
  });

  try {
    const context = await browser.newContext({
      locale: "fr-FR",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    const seedUrls = loadAvitoSeedUrls();
    const listingUrls = new Set<string>(seedUrls);

    if (seedUrls.length === 0) {
      for (const city of cities.slice(0, maxPages)) {
        const searchUrl = `https://www.avito.ma/fr/${city.trim()}/immobilier`;
        try {
          await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
          await page.waitForTimeout(8000);

          const blocked = await page.locator("text=Cloudflare").count();
          if (blocked > 0) {
            errors.push(`Cloudflare actif sur ${searchUrl} — utilisez SCRAPING_PROXY_URL (IP résidentielle)`);
            continue;
          }

          const links = await page.$$eval('a[href*=".htm"]', (anchors) =>
            anchors.map((a) => (a as HTMLAnchorElement).href),
          );

          for (const link of links) {
            if (link.includes("avito.ma/fr/") && link.endsWith(".htm")) {
              listingUrls.add(link);
            }
          }
        } catch (err) {
          errors.push(`search ${city}: ${String(err)}`);
        }

        await sleep(delayMs);
      }
    }

    if (listingUrls.size === 0) {
      errors.push("Aucune URL Avito — définissez AVITO_SCRAPE_URLS ou SCRAPING_PROXY_URL");
    }

    for (const url of listingUrls) {
      if (listings.length >= maxListings) break;

      const externalId = extractAvitoId(url);
      if (!externalId || seenIds.has(externalId)) continue;

      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(4000);

        const html = await page.content();
        if (html.includes("Cloudflare") && html.length < 50000) {
          errors.push(`Cloudflare sur fiche ${url}`);
          continue;
        }

        const jsonLd = findRealEstateListing(extractJsonLdBlocks(html));
        if (jsonLd) {
          const listing = mapJsonLdToRawListing(jsonLd, externalId, url);
          if (listing) {
            listings.push({ ...listing, sourceUrl: url });
            seenIds.add(externalId);
            continue;
          }
        }

        const parsed = await parseAvitoFromDom(page, externalId, url);
        if (parsed) {
          listings.push(parsed);
          seenIds.add(externalId);
        } else {
          errors.push(`parse failed: ${url}`);
        }
      } catch (err) {
        errors.push(`${url}: ${String(err)}`);
      }

      await sleep(delayMs);
    }
  } finally {
    await browser.close();
  }

  return { listings, errors };
}

function loadAvitoSeedUrls(): string[] {
  const fromEnv = process.env.AVITO_SCRAPE_URLS;
  if (!fromEnv) return [];
  return fromEnv.split(",").map((url) => url.trim()).filter(Boolean);
}

async function parseAvitoFromDom(
  page: import("playwright").Page,
  externalId: string,
  url: string,
): Promise<RawPartnerListing | null> {
  const title = (await page.locator("h1").first().textContent())?.trim();
  if (!title) return null;

  const bodyText = (await page.locator("body").innerText()).slice(0, 4000);
  const priceMatch = bodyText.match(/([\d\s.,]+)\s*(?:DH|MAD|Dhs)/i);
  const price = priceMatch ? Number(priceMatch[1].replace(/[^\d]/g, "")) : 0;
  if (price <= 0) return null;

  const images = await page.$$eval("img[src*='avito']", (imgs) =>
    imgs
      .map((img) => (img as HTMLImageElement).src)
      .filter((src) => src.startsWith("http"))
      .slice(0, 12),
  );

  const cityMatch = url.match(/avito\.ma\/fr\/([^/]+)\//i);
  const city = cityMatch ? cityMatch[1].replace(/_/g, " ") : "Maroc";

  return {
    externalId,
    title,
    description: title,
    price,
    currency: "MAD",
    transactionType: /louer|location/i.test(`${title} ${url}`) ? "long_term_rent" : "sale",
    listingType: /villa|riad|terrain|appartement/i.test(title)
      ? (/villa/i.test(title) ? "villa" : /terrain/i.test(title) ? "land" : "apartment")
      : "apartment",
    city: capitalize(city),
    neighborhood: capitalize(city),
    images,
    sourceUrl: url,
  };
}

function capitalize(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
