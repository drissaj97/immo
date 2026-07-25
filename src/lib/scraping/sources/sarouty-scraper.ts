import type { RawPartnerListing } from "@/lib/aggregation/types";
import { fetchJson, sleep } from "../http-client";
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
  const delayMs = options.delayMs ?? Number(process.env.SCRAPE_DELAY_MS ?? 80);

  const listings: RawPartnerListing[] = [];
  const errors: string[] = [];
  const seen = new Set<number>();

  for (let page = 1; page <= maxPages; page++) {
    if (listings.length >= maxListings) break;

    try {
      const url = `${API_BASE}?limit=${pageSize}&page=${page}`;
      const response = await fetchJson<SaroutyListResponse>(url);

      if (response.status !== "success" || !response.data?.data?.length) {
        if (page === 1) errors.push("Sarouty API: réponse vide");
        break;
      }

      for (const item of response.data.data) {
        if (seen.has(item.property_id)) continue;
        seen.add(item.property_id);

        const mapped = mapSaroutyProperty(item);
        if (mapped) listings.push(mapped);
        if (listings.length >= maxListings) break;
      }

      const totalPages = response.data.meta.total_pages;
      if (page % 20 === 0) {
        console.info(`[sarouty] page ${page}/${totalPages} — ${listings.length} annonces`);
      }
      if (page >= totalPages) break;
    } catch (err) {
      errors.push(`page ${page}: ${String(err)}`);
      await sleep(delayMs * 2);
      continue;
    }

    await sleep(delayMs);
  }

  return { listings, errors };
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
