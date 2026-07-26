import type { AggregatedListing } from "@/lib/aggregation/types";
import { resolveListingCoordinates } from "@/lib/geography/resolve-coordinates";
import { resolveMoroccoRegion } from "@/lib/geography/morocco-regions";
import { slugify } from "@/lib/utils";

/**
 * Annonces first-party DarBladi (déposées manuellement, style SemsarAI DepotAnnonce).
 * En mémoire + seed publié pour que le badge « Annonce DarBladi » soit visible en recherche.
 */
const store: AggregatedListing[] = [];

function buildSeed(): AggregatedListing {
  const city = "Casablanca";
  const neighborhood = "Anfa";
  const region = resolveMoroccoRegion(city);
  const coords = resolveListingCoordinates({ city, neighborhood });
  const id = "darbladi-seed-anfa-01";
  return {
    id,
    slug: "darbladi-appartement-anfa-casablanca",
    title: "Appartement lumineux 3 chambres à Anfa",
    description:
      "Bel appartement first-party DarBladi à Anfa, Casablanca. Séjour lumineux, cuisine équipée, 2 salles de bain, parking. Annonce déposée et publiée sur DarBladi (pas un portail tiers).",
    transactionType: "sale",
    listingType: "apartment",
    status: "published",
    price: 2_450_000,
    currency: "MAD",
    livingArea: 118,
    bedrooms: 3,
    bathrooms: 2,
    hasParking: true,
    hasElevator: true,
    location: {
      id: `loc-${id}`,
      city,
      neighborhood,
      region,
      slug: `${slugify(city)}/${slugify(neighborhood)}`,
      latitude: coords.latitude,
      longitude: coords.longitude,
    },
    latitude: coords.latitude,
    longitude: coords.longitude,
    reference: "DB-ANFA-001",
    images: [],
    sourceType: "first_party",
    sourceName: "DarBladi",
    completenessScore: 90,
    freshnessScore: 100,
    isVerified: true,
    isDemo: false,
    publishedAt: "2026-07-20T10:00:00.000Z",
    aggregationSource: "darbladi",
    isExternal: false,
    licenseStatus: "first_party",
    depositReservationEnabled: false,
  };
}

let seeded = false;

function ensureSeed() {
  if (seeded) return;
  seeded = true;
  if (!store.some((l) => l.id === "darbladi-seed-anfa-01")) {
    store.push(buildSeed());
  }
}

export function listDarbladiFirstParty(): AggregatedListing[] {
  ensureSeed();
  return [...store];
}

export function listPublishedDarbladiListings(): AggregatedListing[] {
  return listDarbladiFirstParty().filter((l) => l.status === "published" && !l.isDemo);
}

export function listPendingDarbladiListings(): AggregatedListing[] {
  return listDarbladiFirstParty().filter(
    (l) => l.status === "pending_review" || l.status === "draft",
  );
}

export function getDarbladiListingBySlug(slug: string): AggregatedListing | null {
  return listDarbladiFirstParty().find((l) => l.slug === slug || l.id === slug) ?? null;
}

export function getDarbladiListingById(id: string): AggregatedListing | null {
  return listDarbladiFirstParty().find((l) => l.id === id) ?? null;
}

export function upsertDarbladiListing(listing: AggregatedListing): AggregatedListing {
  ensureSeed();
  const idx = store.findIndex((l) => l.id === listing.id);
  if (idx >= 0) {
    store[idx] = listing;
    return listing;
  }
  store.unshift(listing);
  return listing;
}

export type CreateDarbladiInput = {
  title: string;
  description: string;
  transactionType: "sale" | "long_term_rent";
  listingType: "apartment" | "villa" | "riad" | "land" | "commercial";
  price: number;
  city: string;
  neighborhood: string;
  region?: string;
  livingArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  /** Si true (admin) → published immédiatement */
  publishNow?: boolean;
  advertiserName?: string;
};

export function createDarbladiListing(input: CreateDarbladiInput): AggregatedListing {
  const city = input.city.trim();
  const neighborhood = input.neighborhood.trim();
  const region = resolveMoroccoRegion(city, input.region);
  const coords = resolveListingCoordinates({ city, neighborhood });
  const id = `darbladi-${Date.now().toString(36)}`;
  const slugBase = slugify(input.title) || "annonce";
  const slug = `darbladi-${slugBase}-${id.slice(-6)}`;
  const published = Boolean(input.publishNow);

  const listing: AggregatedListing = {
    id,
    slug,
    title: input.title.trim(),
    description: input.description.trim(),
    transactionType: input.transactionType,
    listingType: input.listingType,
    status: published ? "published" : "pending_review",
    price: input.price,
    currency: "MAD",
    livingArea: input.livingArea,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    location: {
      id: `loc-${id}`,
      city,
      neighborhood,
      region,
      slug: `${slugify(city)}/${slugify(neighborhood)}`,
      latitude: coords.latitude,
      longitude: coords.longitude,
    },
    latitude: coords.latitude,
    longitude: coords.longitude,
    reference: `DB-${Date.now().toString(36).toUpperCase()}`,
    images: (input.images ?? []).filter(Boolean),
    sourceType: "first_party",
    sourceName: "DarBladi",
    completenessScore: 80,
    freshnessScore: 100,
    isVerified: published,
    isDemo: false,
    publishedAt: new Date().toISOString(),
    aggregationSource: "darbladi",
    isExternal: false,
    licenseStatus: "first_party",
  };

  // Métadonnées contact (append description — pas de champ dédié catalogue)
  const contactBits = [
    input.advertiserName ?? input.contactName
      ? `Contact : ${input.advertiserName ?? input.contactName}`
      : null,
    input.contactPhone ? `Tél. : ${input.contactPhone}` : null,
    input.contactEmail ? `Email : ${input.contactEmail}` : null,
  ].filter(Boolean);
  if (contactBits.length) {
    listing.description = `${listing.description}\n\n${contactBits.join("\n")}`;
  }

  return upsertDarbladiListing(listing);
}

export function approveDarbladiListing(id: string): AggregatedListing | null {
  const listing = getDarbladiListingById(id);
  if (!listing) return null;
  listing.status = "published";
  listing.isVerified = true;
  listing.isDemo = false;
  listing.isExternal = false;
  listing.aggregationSource = "darbladi";
  listing.licenseStatus = "first_party";
  listing.sourceName = "DarBladi";
  listing.publishedAt = new Date().toISOString();
  return upsertDarbladiListing(listing);
}

export function rejectDarbladiListing(id: string): boolean {
  const listing = getDarbladiListingById(id);
  if (!listing) return false;
  listing.status = "rejected";
  upsertDarbladiListing(listing);
  return true;
}
