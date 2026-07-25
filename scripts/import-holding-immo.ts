/**
 * Import Holding IMMO listings from public sitemap + JSON-LD (first-party migration).
 * Usage: pnpm import:holding
 */
import { writeFileSync } from "fs";
import path from "path";

const HOLDING_BASE = process.env.HOLDING_IMMO_URL ?? "https://holdingimmo.com";
const CONCURRENCY = 5;

type SchemaListing = {
  "@type": string;
  name?: string;
  description?: string;
  url?: string;
  datePosted?: string;
  image?: string | string[];
  offers?: {
    price?: string;
    priceCurrency?: string;
    businessFunction?: string;
  };
  about?: {
    address?: { addressLocality?: string; addressRegion?: string };
    floorSize?: { value?: number };
    lotSize?: { value?: number };
    numberOfRooms?: number;
    numberOfBathroomsTotal?: number;
    amenityFeature?: Array<{ name?: string; value?: boolean }>;
  };
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function inferListingType(name: string): "apartment" | "villa" | "riad" | "land" | "commercial" {
  const n = name.toLowerCase();
  if (n.includes("riad")) return "riad";
  if (n.includes("terrain") || n.includes("lot ")) return "land";
  if (n.includes("appartement") || n.includes("studio") || n.includes("duplex")) return "apartment";
  if (n.includes("local") || n.includes("bureau")) return "commercial";
  return "villa";
}

function inferTransaction(offers?: SchemaListing["offers"], name?: string): "sale" | "long_term_rent" | "seasonal_rent" {
  const n = (name ?? "").toLowerCase();
  if (n.includes("à louer") || n.includes("a louer") || n.includes("location")) return "long_term_rent";
  if (offers?.businessFunction?.includes("Lease")) return "long_term_rent";
  return "sale";
}

function slugFromUrl(url: string): string {
  return url.replace(/\/$/, "").split("/").pop() ?? `holding-${Date.now()}`;
}

function extractReference(html: string): string | null {
  const m = html.match(/\b(HI\d{2,4})\b/);
  return m?.[1] ?? null;
}

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(`${HOLDING_BASE}/sitemap.xml`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(https:\/\/holdingimmo\.com\/biens\/[^<]+)<\/loc>/g)].map((m) => m[1]);
  return [...new Set(urls)];
}

async function fetchListing(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  const reference = extractReference(html);

  for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      const data = JSON.parse(m[1]) as SchemaListing;
      if (data["@type"] === "RealEstateListing") {
        return { url, reference, data };
      }
    } catch {
      /* skip */
    }
  }
  return null;
}

async function pool<T, R>(items: T[], fn: (item: T) => Promise<R>, size: number): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

async function main() {
  console.info(`[import:holding] Fetching sitemap from ${HOLDING_BASE}...`);
  const urls = await fetchSitemapUrls();
  console.info(`[import:holding] ${urls.length} listing URLs found`);

  const raw = (await pool(urls, fetchListing, CONCURRENCY)).filter(Boolean) as NonNullable<
    Awaited<ReturnType<typeof fetchListing>>
  >[];

  console.info(`[import:holding] Parsed ${raw.length} RealEstateListing JSON-LD documents`);

  const listings = raw.map(({ url, reference, data }, index) => {
    const slug = slugFromUrl(url);
    const name = data.name ?? "Annonce Holding IMMO";
    const city = data.about?.address?.addressLocality ?? "Marrakech";
    const neighborhood = data.about?.address?.addressRegion ?? city;
    const price = Math.round(Number(data.offers?.price ?? 0));
    const images = Array.isArray(data.image) ? data.image : data.image ? [data.image] : [];
    const amenities = data.about?.amenityFeature ?? [];

    return {
      id: `hi-${reference ?? index + 1}`,
      slug: `hi-${slug}`,
      title: name,
      description: stripHtml(data.description ?? name),
      transactionType: inferTransaction(data.offers, name),
      listingType: inferListingType(name),
      status: "published" as const,
      price,
      currency: (data.offers?.priceCurrency ?? "MAD") as "MAD" | "EUR" | "USD",
      livingArea: data.about?.floorSize?.value,
      landArea: data.about?.lotSize?.value,
      bedrooms: data.about?.numberOfRooms,
      bathrooms: data.about?.numberOfBathroomsTotal,
      hasPool: amenities.some((a) => a.name?.includes("Pool") && a.value),
      hasGarden: amenities.some((a) => a.name?.includes("Garden") && a.value),
      hasTerrace: amenities.some((a) => a.name?.includes("Terrace") && a.value),
      location: {
        id: `loc-hi-${slug}`,
        city,
        neighborhood,
        region: "Marrakech-Safi",
        slug: `${city.toLowerCase().replace(/\s+/g, "-")}/${neighborhood.toLowerCase().replace(/\s+/g, "-")}`,
        latitude: 31.63,
        longitude: -7.99,
      },
      latitude: 31.63,
      longitude: -7.99,
      reference: reference ?? `HI-IMP-${index + 1}`,
      images: images.length ? images : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"],
      sourceType: "partner",
      sourceName: "Holding IMMO",
      sourceUrl: url,
      externalId: reference ?? slug,
      completenessScore: 85,
      freshnessScore: 95,
      isVerified: true,
      isDemo: false as const,
      publishedAt: data.datePosted ?? new Date().toISOString(),
    };
  });

  const outPath = path.join(process.cwd(), "src/lib/data/holding-listings.ts");
  const content = `/** Auto-generated by scripts/import-holding-immo.ts — ${new Date().toISOString()} */
import type { DemoListing } from "@/lib/data/demo-data";

export const HOLDING_LISTINGS: DemoListing[] = ${JSON.stringify(listings, null, 2)} as DemoListing[];

export const HOLDING_IMPORT_META = {
  source: "Holding IMMO",
  sourceUrl: "${HOLDING_BASE}",
  importedAt: "${new Date().toISOString()}",
  count: ${listings.length},
  isFirstParty: true,
};
`;

  writeFileSync(outPath, content);
  console.info(`[import:holding] Wrote ${listings.length} listings → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
