import { DEMO_LISTINGS, type DemoListing } from "@/lib/data/demo-data";
import { HOLDING_LISTINGS, HOLDING_IMPORT_META } from "@/lib/data/holding-listings";

/** Unified catalog — Holding IMMO (first-party) + demo seed listings */
export function getCatalogListings(): DemoListing[] {
  const demoOnly = DEMO_LISTINGS.filter((l) => !l.id.startsWith("hi-"));
  const holdingSlugs = new Set(HOLDING_LISTINGS.map((l) => l.slug));
  const uniqueDemo = demoOnly.filter((l) => !holdingSlugs.has(l.slug));
  return [...HOLDING_LISTINGS, ...uniqueDemo];
}

export function getListingCatalogStats() {
  const catalog = getCatalogListings();
  const published = catalog.filter((l) => l.status === "published");
  const cities = new Set(published.map((l) => l.location.city));
  return {
    total: catalog.length,
    published: published.length,
    holdingImmo: HOLDING_LISTINGS.length,
    demoSeed: catalog.length - HOLDING_LISTINGS.length,
    cities: cities.size,
    holdingMeta: HOLDING_IMPORT_META,
  };
}
