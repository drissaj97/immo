export type JsonLdRealEstateListing = {
  "@type"?: string;
  url?: string;
  name?: string;
  description?: string;
  image?: string | string[];
  offers?: {
    price?: number | string;
    priceCurrency?: string;
  };
  itemOffered?: {
    "@type"?: string;
    address?: {
      addressLocality?: string;
      addressRegion?: string;
    };
    numberOfBedrooms?: number;
    numberOfBathroomsTotal?: number;
    floorSize?: {
      value?: number | string;
    };
    geo?: {
      latitude?: number | string;
      longitude?: number | string;
    };
  };
  seller?: {
    name?: string;
  };
};

export function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      // ignore malformed blocks
    }
  }

  return blocks;
}

export function findRealEstateListing(blocks: unknown[]): JsonLdRealEstateListing | null {
  for (const block of blocks) {
    const found = walkForListing(block);
    if (found) return found;
  }
  return null;
}

function walkForListing(node: unknown): JsonLdRealEstateListing | null {
  if (!node || typeof node !== "object") return null;

  const record = node as Record<string, unknown>;
  const type = record["@type"];

  if (type === "RealEstateListing" || (Array.isArray(type) && type.includes("RealEstateListing"))) {
    return record as JsonLdRealEstateListing;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = walkForListing(item);
      if (found) return found;
    }
  } else {
    for (const value of Object.values(record)) {
      const found = walkForListing(value);
      if (found) return found;
    }
  }

  return null;
}

export function parsePrice(value: number | string | undefined): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const digits = String(value).replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}
