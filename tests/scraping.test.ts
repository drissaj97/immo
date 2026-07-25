import { describe, expect, it } from "vitest";
import { mapJsonLdToRawListing } from "@/lib/scraping/map-listing";
import { extractJsonLdBlocks, findRealEstateListing, parsePrice } from "@/lib/scraping/parse-json-ld";

const SAMPLE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  url: "https://www.mubawab.ma/fr/a/8322586/vend-appartement",
  name: "Vend appartement à Palmier. 3 chambres",
  description: "Bel appartement",
  image: ["https://www.mubawab-media.com/ad/photo.avif"],
  offers: {
    "@type": "Offer",
    price: 2200000,
    priceCurrency: "MAD",
  },
  itemOffered: {
    "@type": "Apartment",
    address: {
      addressLocality: "Casablanca",
    },
    numberOfBedrooms: 3,
    numberOfBathroomsTotal: 2,
    floorSize: { value: 140, unitCode: "MTR" },
  },
  seller: { name: "Agence Test" },
};

describe("Scraping parsers", () => {
  it("parse un bloc JSON-LD immobilier", () => {
    const html = `<html><script type="application/ld+json">${JSON.stringify(SAMPLE_JSON_LD)}</script></html>`;
    const blocks = extractJsonLdBlocks(html);
    const listing = findRealEstateListing(blocks);
    expect(listing?.name).toContain("Palmier");
  });

  it("mappe JSON-LD vers RawPartnerListing", () => {
    const mapped = mapJsonLdToRawListing(
      SAMPLE_JSON_LD,
      "8322586",
      "https://www.mubawab.ma/fr/a/8322586/vend-appartement",
    );
    expect(mapped?.price).toBe(2200000);
    expect(mapped?.city).toBe("Casablanca");
    expect(mapped?.bedrooms).toBe(3);
    expect(mapped?.advertiserName).toBe("Agence Test");
  });

  it("parse les prix texte MAD", () => {
    expect(parsePrice("2 200 000 DH")).toBe(2200000);
    expect(parsePrice(1500000)).toBe(1500000);
  });
});
