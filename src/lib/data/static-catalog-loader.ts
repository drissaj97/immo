import type { DemoListing } from "@/lib/data/demo-data";

let semsaraiCache: DemoListing[] | null = null;
let semsaraiLoading: Promise<DemoListing[]> | null = null;

/** Charge les 5000 annonces SEMSAR AI à la demande (évite 12 Mo au démarrage). */
export async function loadSemsaraiListings(): Promise<DemoListing[]> {
  if (semsaraiCache) return semsaraiCache;
  if (!semsaraiLoading) {
    semsaraiLoading = import("@/lib/data/semsarai-listings").then((mod) => {
      semsaraiCache = mod.SEMSARAI_LISTINGS;
      return semsaraiCache;
    });
  }
  return semsaraiLoading;
}

export function resetSemsaraiListingsCache(): void {
  semsaraiCache = null;
  semsaraiLoading = null;
}
