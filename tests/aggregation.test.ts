import { describe, expect, it } from "vitest";
import { dedupeAggregatedListings } from "@/lib/aggregation/dedupe";
import { normalizePartnerListing } from "@/lib/aggregation/normalizer";
import { syncAggregatedCatalog } from "@/lib/aggregation/sync";

describe("Aggregation platform", () => {
  it("sync inclut Holding IMMO + DarBladi", async () => {
    const { listings, results } = await syncAggregatedCatalog();
    expect(listings.length).toBeGreaterThanOrEqual(60);
    const holding = results.find((r) => r.source === "holding-immo");
    expect(holding?.imported).toBeGreaterThanOrEqual(50);
  });

  it("normalise une annonce partenaire Avito", () => {
    const listing = normalizePartnerListing(
      {
        externalId: "12345",
        title: "Appartement F3 Casablanca",
        price: 1200000,
        city: "Casablanca",
        neighborhood: "Anfa",
        sourceUrl: "https://www.avito.ma/fr/xxx",
      },
      "avito",
      "partner_contract",
    );
    expect(listing.aggregationSource).toBe("avito");
    expect(listing.isExternal).toBe(true);
    expect(listing.sourceUrl).toContain("avito.ma");
  });

  it("déduplique en priorisant first_party", () => {
    const partner = normalizePartnerListing(
      {
        externalId: "HI111",
        title: "Villa Amelkis",
        price: 23500000,
        city: "Marrakech",
        sourceUrl: "https://avito.ma/x",
      },
      "avito",
      "licensed_api",
    );
    const firstParty = normalizePartnerListing(
      {
        externalId: "HI111",
        title: "Villa Amelkis",
        price: 23500000,
        city: "Marrakech",
        sourceUrl: "https://holdingimmo.com/x",
      },
      "holding-immo",
      "first_party",
    );
    const deduped = dedupeAggregatedListings([partner, firstParty]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].aggregationSource).toBe("holding-immo");
  });
});
