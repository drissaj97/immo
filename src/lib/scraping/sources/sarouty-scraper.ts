import type { RawPartnerListing } from "@/lib/aggregation/types";
import { mapPool } from "../concurrency";
import { fetchJson } from "../http-client";
import { maybeSleep, resolveConcurrency, resolveDelayMs } from "../scrape-config";
import type { ScrapeOptions } from "../types";

const API_BASE = "https://b2c-be-prod.api.sarouty.ma/api/properties";

type SaroutyListResponse = {
  status: string;
  data?: {
    data: SaroutyProperty[];
    meta: {
      total: number;
      page: number;
      limit: number;
      total_pages: number;
    };
  };
};

type SaroutyProperty = {
  property_id: number;
  property_title_fr?: string;
  property_title_en?: string;
  property_text_fr?: string;
  property_sqft?: number;
  total_bedroom?: number | null;
  total_bathroom?: number | null;
  location_name?: string;
  location_url_slug?: string;
  property_date_creation?: string;
  property_housing_type?: string;
  property_category_key?: string;
  price?: { price?: number; price_type?: string };
  images?: Array<{ property_image_url?: string }>;
  agent_broker_name?: string;
  agent_company_name?: string;
};

export async function scrapeSarouty(options: ScrapeOptions = {}): Promise<{
  listings: RawPartnerListing[];
  errors: string[];
}> {
  const pageSize = 50;
  const maxPages = options.maxPages ?? Number(process.env.SCRAPE_SAROUTY_MAX_PAGES ?? 200);
  const maxListings = options.maxListings ?? Number(process.env.SCRAPE_MAX_LISTINGS ?? 5000);
  const delayMs = resolveDelayMs(options.delayMs);
  const concurrency = resolveConcurrency("SCRAPE_SAROUTY_CONCURRENCY", 24, 4);

  const listings: RawPartnerListing[] = [];
  const errors: string[] = [];
  const seen = new Set<number>();

  // Page 1 → connaître total_pages, puis fan-out parallèle
  let totalPages = 1;
  try {
    const first = await fetchJson<SaroutyListResponse>(`${API_BASE}?limit=${pageSize}&page=1`);
    if (first.status !== "success" || !first.data?.data?.length) {
      errors.push("Sarouty API: réponse vide");
      return { listings, errors };
    }
    for (const item of first.data.data) {
      if (seen.has(item.property_id)) continue;
      seen.add(item.property_id);
      const mapped = mapSaroutyProperty(item);
      if (mapped) listings.push(mapped);
    }
    totalPages = Math.min(maxPages, first.data.meta.total_pages || 1);
    console.info(
      `[sarouty] ${first.data.meta.total} annonces API — pages 2..${totalPages} en parallèle (×${concurrency})`,
    );
  } catch (err) {
    errors.push(`page 1: ${String(err)}`);
    return { listings, errors };
  }

  if (listings.length >= maxListings || totalPages <= 1) {
    return { listings: listings.slice(0, maxListings), errors };
  }

  const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  await mapPool(pages, concurrency, async (page) => {
    if (listings.length >= maxListings) return;
    try {
      const response = await fetchJson<SaroutyListResponse>(
        `${API_BASE}?limit=${pageSize}&page=${page}`,
      );
      if (response.status !== "success" || !response.data?.data?.length) return;

      for (const item of response.data.data) {
        if (listings.length >= maxListings) break;
        if (seen.has(item.property_id)) continue;
        seen.add(item.property_id);
        const mapped = mapSaroutyProperty(item);
        if (mapped) listings.push(mapped);
      }
      if (page % 40 === 0) {
        console.info(`[sarouty] page ${page}/${totalPages} — ${listings.length} annonces`);
      }
    } catch (err) {
      errors.push(`page ${page}: ${String(err)}`);
    }
    await maybeSleep(delayMs);
  });

  return { listings: listings.slice(0, maxListings), errors: errors.slice(0, 80) };
}

function mapSaroutyProperty(item: SaroutyProperty): RawPartnerListing | null {
  const title = item.property_title_fr?.trim() || item.property_title_en?.trim();
  const price = item.price?.price ?? 0;
  if (!title || price <= 0) return null;

  const city = capitalizeCity(item.location_url_slug ?? "Maroc");
  const neighborhood = item.location_name ?? city;

  return {
    externalId: String(item.property_id),
    title,
    description: item.property_text_fr?.trim() || title,
    price,
    currency: "MAD",
    transactionType: item.property_category_key === "rent" ? "long_term_rent" : "sale",
    listingType: inferSaroutyType(item.property_housing_type, title),
    city,
    neighborhood,
    livingArea: item.property_sqft,
    bedrooms: item.total_bedroom ?? undefined,
    bathrooms: item.total_bathroom ?? undefined,
    images: (item.images ?? [])
      .map((img) => img.property_image_url)
      .filter((url): url is string => Boolean(url)),
    sourceUrl: `https://www.sarouty.ma/property-details/?listing_id=${item.property_id}`,
    publishedAt: item.property_date_creation,
    advertiserName: item.agent_broker_name ?? item.agent_company_name,
  };
}

function capitalizeCity(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferSaroutyType(
  housingType: string | undefined,
  title: string,
): RawPartnerListing["listingType"] {
  const text = `${housingType ?? ""} ${title}`.toLowerCase();
  if (text.includes("terrain")) return "land";
  if (text.includes("bureau") || text.includes("commercial")) return "commercial";
  if (text.includes("villa")) return "villa";
  if (text.includes("riad")) return "riad";
  return "apartment";
}
