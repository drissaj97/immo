import { describe, expect, it } from "vitest";
import {
  resolveOriginalPortal,
  stripSemsaraiBrand,
} from "@/lib/listings/original-portal";
import { normalizeSemsaraiListing, semsaraiPropertyToListing } from "@/lib/semsarai/normalizer";

describe("original-portal", () => {
  it("retire la marque Semsar AI", () => {
    expect(stripSemsaraiBrand("SEMSAR AI · Mubawab")).toBe("Mubawab");
    expect(stripSemsaraiBrand("Mubawab.ma")).toBe("Mubawab.ma");
  });

  it("mappe site/URL vers Mubawab ou Avito", () => {
    expect(
      resolveOriginalPortal({ site: "mubawab", sourceUrl: "https://www.mubawab.ma/fr/a/1" })
        .displayName,
    ).toBe("Mubawab.ma");
    expect(
      resolveOriginalPortal({
        sourceName: "SEMSAR AI · Avito",
        sourceUrl: "https://www.avito.ma/fr/x.htm",
      }).aggregationSource,
    ).toBe("avito");
  });

  it("normalizeSemsaraiListing n'expose jamais Semsar AI", () => {
    const raw = semsaraiPropertyToListing({
      id: "abc123def4567890",
      title: "Appart Casablanca",
      price: 1000000,
      cityName: "Casablanca",
      site: "mubawab",
      link: "https://www.mubawab.ma/fr/a/99/test",
      sell: true,
    });
    const listing = normalizeSemsaraiListing({
      ...raw,
      sourceName: "SEMSAR AI · Mubawab",
    });
    expect(listing.sourceName).toBe("Mubawab.ma");
    expect(listing.aggregationSource).toBe("mubawab");
    expect(JSON.stringify(listing)).not.toMatch(/SEMSAR AI/i);
  });
});
