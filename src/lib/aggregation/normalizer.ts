import type { DemoListing } from "@/lib/data/demo-data";
import type {
  AggregatedListing,
  AggregationLicenseStatus,
  AggregationSourceId,
  RawPartnerListing,
} from "./types";
import { resolvePartnerLocation } from "@/lib/geography/partner-locations";
import { resolveListingCoordinates } from "@/lib/geography/resolve-coordinates";
import { sanitizeListingImages } from "@/lib/media/listing-images";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function normalizePartnerListing(
  raw: RawPartnerListing,
  source: AggregationSourceId,
  licenseStatus: AggregationLicenseStatus,
): AggregatedListing {
  const slug = `${source}-${slugify(raw.externalId || raw.title)}`;
  const { city, neighborhood } = resolvePartnerLocation({
    city: raw.city,
    neighborhood: raw.neighborhood,
  });
  const region = raw.region ?? "Maroc";
  const coords = resolveListingCoordinates({
    city,
    neighborhood,
    latitude: raw.latitude,
    longitude: raw.longitude,
  });

  const base: DemoListing = {
    id: `${source}-${raw.externalId}`,
    slug,
    title: raw.title,
    description: raw.description ?? raw.title,
    transactionType: raw.transactionType ?? "sale",
    listingType: raw.listingType ?? "apartment",
    status: "published",
    price: raw.price,
    currency: raw.currency ?? "MAD",
    livingArea: raw.livingArea,
    landArea: raw.landArea,
    bedrooms: raw.bedrooms,
    bathrooms: raw.bathrooms,
    location: {
      id: `loc-${source}-${slugify(city)}-${slugify(neighborhood)}`,
      city,
      neighborhood,
      region,
      slug: `${slugify(raw.city)}/${slugify(neighborhood)}`,
      latitude: coords.latitude,
      longitude: coords.longitude,
    },
    latitude: coords.latitude,
    longitude: coords.longitude,
    reference: raw.externalId,
    images: sanitizeListingImages(raw.images),
    sourceType: "partner",
    sourceName: sourceDisplayName(source),
    sourceUrl: absoluteSourceUrl(raw.sourceUrl, source, raw.externalId),
    externalId: raw.externalId,
    completenessScore: 75,
    freshnessScore: 90,
    isVerified: licenseStatus === "partner_contract" || licenseStatus === "licensed_api",
    isDemo: false,
    publishedAt: raw.publishedAt ?? new Date().toISOString(),
  };

  return {
    ...base,
    aggregationSource: source,
    isExternal: true,
    licenseStatus,
  };
}

function sourceDisplayName(source: AggregationSourceId): string {
  const names: Record<AggregationSourceId, string> = {
    darbladi: "DarBladi",
    semsarai: "Portail immobilier",
    "holding-immo": "Holding IMMO",
    avito: "Avito.ma",
    mubawab: "Mubawab.ma",
    sarouty: "Sarouty.ma",
    agenz: "Agenz.ma",
    yakeey: "Yakeey",
  };
  return names[source];
}

function absoluteSourceUrl(
  url: string | undefined,
  source: AggregationSourceId,
  externalId: string,
): string {
  const raw = url?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return raw;
  if (raw?.startsWith("//")) return `https:${raw}`;
  if (source === "mubawab") return `https://www.mubawab.ma/fr/a/${externalId}`;
  if (source === "avito") {
    return raw?.startsWith("/")
      ? `https://www.avito.ma${raw}`
      : `https://www.avito.ma/fr/${externalId}.htm`;
  }
  if (source === "sarouty") {
    return `https://www.sarouty.ma/property-details/?listing_id=${externalId}`;
  }
  if (source === "holding-immo") {
    const path = raw?.startsWith("/") ? raw : `/biens/${externalId}`;
    return `https://holdingimmo.com${path}`;
  }
  if (source === "agenz") return raw || `https://www.agenz.ma`;
  if (source === "yakeey") return raw || `https://www.yakeey.com`;
  return raw || "";
}

export function normalizeHoldingListing(listing: DemoListing): AggregatedListing {
  return {
    ...listing,
    aggregationSource: "holding-immo",
    isExternal: false,
    licenseStatus: "first_party",
  };
}

export function normalizeDarbladiListing(listing: DemoListing): AggregatedListing {
  return {
    ...listing,
    aggregationSource: "darbladi",
    isExternal: false,
    licenseStatus: "first_party",
  };
}
