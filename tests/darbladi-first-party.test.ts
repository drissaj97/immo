import { describe, expect, it } from "vitest";
import {
  approveDarbladiListing,
  createDarbladiListing,
  getDarbladiListingBySlug,
  listPublishedDarbladiListings,
} from "@/lib/data/darbladi-first-party";
import { fetchDarbladiListings } from "@/lib/aggregation/sources/darbladi-source";
import { listingMatchesFilters } from "@/lib/search/listing-filters-match";

describe("annonces DarBladi first-party", () => {
  it("expose au moins une annonce seed publiee avec badge DarBladi", () => {
    const published = listPublishedDarbladiListings();
    expect(published.length).toBeGreaterThanOrEqual(1);
    const seed = published.find((l) => l.id === "darbladi-seed-anfa-01");
    expect(seed).toBeTruthy();
    expect(seed!.aggregationSource).toBe("darbladi");
    expect(seed!.isExternal).toBe(false);
    expect(seed!.isDemo).toBe(false);
    expect(seed!.sourceName).toBe("DarBladi");
    expect(seed!.status).toBe("published");
  });

  it("creer une annonce manuelle en pending puis la publier", () => {
    const draft = createDarbladiListing({
      title: "Studio test DarBladi Guéliz",
      description: "Studio deposé manuellement pour tests.",
      transactionType: "long_term_rent",
      listingType: "apartment",
      price: 6500,
      city: "Marrakech",
      neighborhood: "Guéliz",
      contactName: "Agent Test",
      contactEmail: "agent@darbladi.demo",
    });
    expect(draft.status).toBe("pending_review");
    expect(draft.aggregationSource).toBe("darbladi");
    expect(draft.isDemo).toBe(false);

    const approved = approveDarbladiListing(draft.id);
    expect(approved?.status).toBe("published");
    expect(approved?.isVerified).toBe(true);
    expect(getDarbladiListingBySlug(draft.slug)?.status).toBe("published");
    expect(fetchDarbladiListings().some((l) => l.id === draft.id)).toBe(true);
  });

  it("apparait dans le filtre Acheter Anfa", () => {
    const seed = getDarbladiListingBySlug("darbladi-appartement-anfa-casablanca");
    expect(seed).toBeTruthy();
    expect(
      listingMatchesFilters(seed as never, {
        transactionType: "sale",
        city: "Casablanca",
        neighborhood: "Anfa",
      }),
    ).toBe(true);
  });
});
