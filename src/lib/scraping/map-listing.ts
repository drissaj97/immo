import type { RawPartnerListing } from "@/lib/aggregation/types";
import { parsePrice } from "./parse-json-ld";
import type { JsonLdRealEstateListing } from "./parse-json-ld";
import { RENT_PRICE_CEILING_MAD } from "@/lib/search/effective-transaction-type";

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
  const listingType = inferListingType(item?.["@type"] as string | undefined, title);
  const sourceUrl = jsonLd.url ?? fallbackUrl;

  return {
    externalId,
    title,
    description: jsonLd.description ?? title,
    price,
    currency: (jsonLd.offers?.priceCurrency as "MAD") ?? "MAD",
    transactionType: inferTransactionType(title, sourceUrl, price, listingType),
    listingType,
    city,
    neighborhood,
    livingArea: toNumber(item?.floorSize?.value),
    bedrooms: item?.numberOfBedrooms,
    bathrooms: item?.numberOfBathroomsTotal,
    latitude: lat,
    longitude: lng,
    images,
    sourceUrl,
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

export function inferTransactionType(
  title: string,
  url: string,
  price = 0,
  listingType?: RawPartnerListing["listingType"],
): RawPartnerListing["transactionType"] {
  const text = `${title} ${url}`.toLowerCase();
  // Vente prioritaire si signal clair (évite faux "location" dans une annonce à vendre).
  if (
    /à vendre|a vendre|vente d|immobilier-a-vendre|\/a-vendre|for sale/.test(text)
  ) {
    return "sale";
  }
  if (
    /à louer|a louer|location d|immobilier-a-louer|\/a-louer|for rent|\brent\b/.test(text) ||
    text.includes("louer") ||
    text.includes("location")
  ) {
    return "long_term_rent";
  }
  // Prix mensuel typique sans signal texte → location (sauf terrains).
  if (listingType !== "land" && price > 0 && price < RENT_PRICE_CEILING_MAD) {
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
