import type { RawPartnerListing } from "@/lib/aggregation/types";
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

type CardPayload = {
  href: string;
  text: string;
  img: string;
};

/**
 * Scraping Avito depuis les pages recherche (évite Cloudflare des fiches détail).
 * Multi-catégories + nouveau contexte navigateur par ville pour maximiser le volume.
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

            const cards = await extractCards(page);
            if (!cards.length) break;

            let added = 0;
            for (const card of cards) {
              if (listings.length >= maxListings) break;
              const listing = mapCardToListing(card, city);
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

async function extractCards(page: import("playwright").Page): Promise<CardPayload[]> {
  return page.evaluate(() => {
    const anchors = [...document.querySelectorAll("a[href*=\".htm\"]")] as HTMLAnchorElement[];
    const seen = new Set<string>();
    const out: CardPayload[] = [];
    for (const a of anchors) {
      if (!/avito\.ma\/fr\/.+\/.+\.htm/i.test(a.href)) continue;
      const href = a.href.split("?")[0];
      if (seen.has(href)) continue;
      seen.add(href);
      const text = (a.innerText || "").trim();
      if (text.length < 12) continue;
      const img =
        a.querySelector("img")?.getAttribute("src") ||
        a.querySelector("img")?.getAttribute("data-src") ||
        "";
      out.push({ href, text, img });
    }
    return out;
  });
}

function mapCardToListing(card: CardPayload, citySlug: string): RawPartnerListing | null {
  const externalId = extractAvitoId(card.href);
  if (!externalId) return null;

  const lines = card.text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const title = lines[0];
  if (!title) return null;

  const price = extractPrice(card.text);
  if (!price) return null;

  const locLine = lines.find((l) => /,/i.test(l) && !/DH|m²|chambre|sdb|Étage|il y a/i.test(l));
  let city = capitalize(citySlug.replace(/_/g, " "));
  let neighborhood = city;
  if (locLine) {
    const parts = locLine.split(",").map((p) => p.trim());
    if (parts[0]) city = parts[0];
    if (parts[1]) neighborhood = parts[1];
  } else {
    const fromUrl = card.href.match(/avito\.ma\/fr\/([^/]+)\//i);
    if (fromUrl) neighborhood = capitalize(decodeURIComponent(fromUrl[1]).replace(/_/g, " "));
  }

  const bedrooms = matchNumber(card.text, /(\d+)\s*chambres?/i);
  const bathrooms = matchNumber(card.text, /(\d+)\s*sdb/i);
  const livingArea = matchNumber(card.text, /(\d+)\s*m²/i);

  return {
    externalId,
    title,
    description: title,
    price,
    currency: "MAD",
    transactionType: /à louer|location|louer/i.test(card.text) ? "long_term_rent" : "sale",
    listingType: inferType(title, card.href),
    city,
    neighborhood,
    bedrooms,
    bathrooms,
    livingArea,
    images: card.img ? [card.img] : [],
    sourceUrl: card.href,
  };
}

function extractPrice(text: string): number | null {
  // Prendre le premier montant suivi de DH (pas DH/mois)
  const matches = [...text.matchAll(/([\d\s\u202f.,]+)\s*\n?\s*DH(?!\s*\/)/gi)];
  for (const match of matches) {
    const n = Number(match[1].replace(/[^\d]/g, ""));
    if (n >= 500) return n;
  }
  return null;
}

function matchNumber(text: string, re: RegExp): number | undefined {
  const m = text.match(re);
  return m ? Number(m[1]) : undefined;
}

function inferType(title: string, url: string): RawPartnerListing["listingType"] {
  const t = `${title} ${url}`.toLowerCase();
  if (t.includes("terrain")) return "land";
  if (t.includes("villa") || t.includes("riad")) return t.includes("riad") ? "riad" : "villa";
  if (t.includes("local") || t.includes("bureau") || t.includes("commercial")) return "commercial";
  return "apartment";
}

function capitalize(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}
