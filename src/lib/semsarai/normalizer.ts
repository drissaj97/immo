import type { DemoListing } from "@/lib/data/demo-data";
import type { AggregatedListing } from "@/lib/aggregation/types";
import type { SemsaraiProperty } from "./types";

import { resolveMoroccoRegion } from "@/lib/geography/morocco-regions";
import { resolveListingCoordinates } from "@/lib/geography/resolve-coordinates";
import { resolveOriginalPortal } from "@/lib/listings/original-portal";
import { sanitizeListingImages } from "@/lib/media/listing-images";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

/** Slug catalogue DarBladi (historique : préfixe semsar- pour stabilité des URLs). */
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
  const region = resolveMoroccoRegion(city, city);
  const portal = resolveOriginalPortal({
    site: p.site,
    sourceUrl: p.link,
  });
  const coords = resolveListingCoordinates({ city, neighborhood });

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
      region,
      slug: `${slugify(city)}/${slugify(neighborhood)}`,
      latitude: coords.latitude,
      longitude: coords.longitude,
    },
    latitude: coords.latitude,
    longitude: coords.longitude,
    reference: p.id.slice(0, 12).toUpperCase(),
    images: sanitizeListingImages(images),
    sourceType: "partner",
    sourceName: portal.displayName,
    sourceUrl: p.link ?? undefined,
    externalId: p.id,
    completenessScore: 80,
    freshnessScore: 90,
    isVerified: true,
    isDemo: false,
    publishedAt: p.createdAt ?? new Date().toISOString(),
  };
}

/** Attribue la source originale (Mubawab / Avito…) — jamais la marque Semsar AI. */
export function normalizeSemsaraiListing(listing: DemoListing): AggregatedListing {
  const portal = resolveOriginalPortal({
    sourceName: listing.sourceName,
    sourceUrl: listing.sourceUrl,
  });

  return {
    ...listing,
    sourceName: portal.displayName,
    sourceUrl: listing.sourceUrl,
    aggregationSource: portal.aggregationSource,
    isExternal: true,
    licenseStatus: "licensed_api",
  };
}
