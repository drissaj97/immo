import { describe, expect, it } from "vitest";
import { semsaraiPropertyToListing, semsaraiSlug } from "@/lib/semsarai/normalizer";

describe("semsarai normalizer", () => {
  it("génère un slug compatible semsarai.ma", () => {
    expect(semsaraiSlug("Appart Guéliz Marrakech", "deadbeef4abc4351")).toMatch(/4abc4351$/);
  });

  it("mappe une propriété API vers DemoListing", () => {
    const listing = semsaraiPropertyToListing({
      id: "abc123def4567890",
      title: "Villa à vendre Marrakech",
      description: "Belle villa",
      price: 3500000,
      surface: 220,
      cityName: "Marrakech",
      quartier: "Palmeraie",
      propertyTypeName: "Villa",
      sell: true,
      longTerm: false,
      site: "mubawab",
      link: "https://www.mubawab.ma/fr/a/123/test",
      images: ["https://www.mubawab-media.com/ad/test.avif"],
    });
    expect(listing.isDemo).toBe(false);
    expect(listing.slug.startsWith("semsar-")).toBe(true);
    expect(listing.sourceName).toContain("SEMSAR AI");
    expect(listing.images[0]).toContain("mubawab-media");
  });
});
