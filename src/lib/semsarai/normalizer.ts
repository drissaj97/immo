import type { DemoListing } from "@/lib/data/demo-data";
import type { AggregatedListing } from "@/lib/aggregation/types";
import type { SemsaraiProperty } from "./types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

/** Slug compatible pages semsarai.ma/property/{slug} */
export function semsaraiSlug(title: string, id: string): string {
  return `${slugify(title)}-${id.slice(-8)}`;
}

function inferListingType(name?: string): DemoListing["listingType"] {
  const n = (name ?? "").toLowerCase();
  if (n.includes("terrain")) return "land";
  if (n.includes("local") || n.includes("bureau") || n.includes("commercial")) return "commercial";
  if (n.includes("villa") || n.includes("riad")) return n.includes("riad") ? "riad" : "villa";
  return "apartment";
}

function inferTransaction(p: SemsaraiProperty): DemoListing["transactionType"] {
  if (p.longTerm) return "long_term_rent";
  if (p.sell === false) return "long_term_rent";
  return "sale";
}

export function semsaraiPropertyToListing(
  p: SemsaraiProperty,
  images: string[] = p.images ?? [],
): DemoListing {
  const slug = semsaraiSlug(p.title, p.id);
  const city = p.cityName ?? "Maroc";
  const neighborhood = p.quartier ?? city;
  const siteLabel = p.site ? p.site.charAt(0).toUpperCase() + p.site.slice(1) : "Portail";

  return {
    id: `semsar-${p.id}`,
    slug: `semsar-${slug}`,
    title: p.title,
    description: p.description || p.title,
    transactionType: inferTransaction(p),
    listingType: inferListingType(p.propertyTypeName),
    status: "published",
    price: Math.round(p.price ?? 0),
    currency: "MAD",
    livingArea: p.surface,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    hasPool: p.features?.some((f) => /piscine/i.test(f)) ?? false,
    hasParking: p.features?.some((f) => /garage|parking/i.test(f)) ?? false,
    hasGarden: p.features?.some((f) => /jardin/i.test(f)) ?? false,
    hasTerrace: p.features?.some((f) => /terrasse/i.test(f)) ?? false,
    location: {
      id: `loc-semsar-${slugify(city)}-${slugify(neighborhood)}`,
      city,
      neighborhood,
      region: city,
      slug: `${slugify(city)}/${slugify(neighborhood)}`,
      latitude: 33.5,
      longitude: -7.5,
    },
    latitude: 33.5,
    longitude: -7.5,
    reference: p.id.slice(0, 12).toUpperCase(),
    images: images.length
      ? images
      : ["https://www.semsarai.ma/default-property-image.jpg"],
    sourceType: "partner",
    sourceName: `SEMSAR AI · ${siteLabel}`,
    sourceUrl: p.link ?? `https://www.semsarai.ma/property/${slug}`,
    externalId: p.id,
    completenessScore: 80,
    freshnessScore: 90,
    isVerified: true,
    isDemo: false,
    publishedAt: p.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeSemsaraiListing(listing: DemoListing): AggregatedListing {
  return {
    ...listing,
    aggregationSource: "semsarai",
    isExternal: true,
    licenseStatus: "licensed_api",
  };
}
