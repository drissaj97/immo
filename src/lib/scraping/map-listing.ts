import type { RawPartnerListing } from "@/lib/aggregation/types";
import { parsePrice } from "./parse-json-ld";
import type { JsonLdRealEstateListing } from "./parse-json-ld";

export function mapJsonLdToRawListing(
  jsonLd: JsonLdRealEstateListing,
  externalId: string,
  fallbackUrl: string,
): RawPartnerListing | null {
  const title = jsonLd.name?.trim();
  const price = parsePrice(jsonLd.offers?.price);
  if (!title || price <= 0) return null;

  const images = normalizeImages(jsonLd.image);
  const item = jsonLd.itemOffered;
  const city = item?.address?.addressLocality ?? "Maroc";
  const neighborhood = item?.address?.addressRegion ?? city;
  const lat = toNumber(item?.geo?.latitude);
  const lng = toNumber(item?.geo?.longitude);

  return {
    externalId,
    title,
    description: jsonLd.description ?? title,
    price,
    currency: (jsonLd.offers?.priceCurrency as "MAD") ?? "MAD",
    transactionType: inferTransactionType(title, jsonLd.url ?? fallbackUrl),
    listingType: inferListingType(item?.["@type"] as string | undefined, title),
    city,
    neighborhood,
    livingArea: toNumber(item?.floorSize?.value),
    bedrooms: item?.numberOfBedrooms,
    bathrooms: item?.numberOfBathroomsTotal,
    latitude: lat,
    longitude: lng,
    images,
    sourceUrl: jsonLd.url ?? fallbackUrl,
    advertiserName: jsonLd.seller?.name,
  };
}

function normalizeImages(image: string | string[] | undefined): string[] {
  if (!image) return [];
  return Array.isArray(image) ? image.filter(Boolean) : [image];
}

function toNumber(value: number | string | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function inferTransactionType(title: string, url: string): RawPartnerListing["transactionType"] {
  const text = `${title} ${url}`.toLowerCase();
  if (text.includes("louer") || text.includes("location") || text.includes("à louer") || text.includes("a-louer")) {
    return "long_term_rent";
  }
  return "sale";
}

function inferListingType(
  schemaType: string | undefined,
  title: string,
): RawPartnerListing["listingType"] {
  const text = `${schemaType ?? ""} ${title}`.toLowerCase();
  if (text.includes("riad")) return "riad";
  if (text.includes("terrain") || text.includes("land")) return "land";
  if (text.includes("bureau") || text.includes("local") || text.includes("commercial")) return "commercial";
  if (text.includes("villa")) return "villa";
  return "apartment";
}

export function extractMubawabId(url: string): string | null {
  const match = url.match(/\/(?:fr\/)?(?:a|pa)\/(\d+)/i);
  return match?.[1] ?? null;
}

export function extractAvitoId(url: string): string | null {
  const match = url.match(/_(\d{6,})\.htm/i);
  return match?.[1] ?? null;
}

export function normalizeMubawabUrl(url: string): string {
  if (url.startsWith("http")) {
    return url.replace("https://www.mubawab.ma/pa/", "https://www.mubawab.ma/fr/pa/");
  }
  const path = url.startsWith("/") ? url : `/${url}`;
  if (path.startsWith("/pa/")) {
    return `https://www.mubawab.ma/fr${path}`;
  }
  return `https://www.mubawab.ma${path}`;
}
