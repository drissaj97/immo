import type { DemoListing } from "@/lib/data/demo-data";
import type {
  AggregatedListing,
  AggregationLicenseStatus,
  AggregationSourceId,
  RawPartnerListing,
} from "./types";
import { resolveListingCoordinates } from "@/lib/geography/resolve-coordinates";

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
  const neighborhood = raw.neighborhood ?? raw.city;
  const region = raw.region ?? "Maroc";
  const coords = resolveListingCoordinates({
    city: raw.city,
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
      id: `loc-${source}-${slugify(raw.city)}-${slugify(neighborhood)}`,
      city: raw.city,
      neighborhood,
      region,
      slug: `${slugify(raw.city)}/${slugify(neighborhood)}`,
      latitude: coords.latitude,
      longitude: coords.longitude,
    },
    latitude: coords.latitude,
    longitude: coords.longitude,
    reference: raw.externalId,
    images: raw.images?.length
      ? raw.images
      : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80"],
    sourceType: "partner",
    sourceName: sourceDisplayName(source),
    sourceUrl: raw.sourceUrl,
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
    "darbladi": "DarBladi",
    semsarai: "SEMSAR AI",
    "holding-immo": "Holding IMMO",
    avito: "Avito.ma",
    mubawab: "Mubawab.ma",
    sarouty: "Sarouty.ma",
  };
  return names[source];
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
