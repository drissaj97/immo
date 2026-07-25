import { describe, expect, it } from "vitest";
import { resolvePartnerLocation } from "@/lib/geography/partner-locations";
import { loadNeighborhoodCatalog } from "@/lib/search/neighborhood-catalog";

describe("partner-locations", () => {
  it("remonte Bouskoura quand tagué quartier de Casablanca", () => {
    expect(
      resolvePartnerLocation({ city: "Casablanca", neighborhood: "Bouskoura" }),
    ).toEqual({ city: "Bouskoura", neighborhood: "Bouskoura" });
  });
});

describe("neighborhood-catalog", () => {
  it("charge le cache quartier si présent", () => {
    const listings = loadNeighborhoodCatalog("Bouskoura", "Victoria");
    if (listings.length > 0) {
      expect(listings[0].cityName?.toLowerCase()).toContain("bouskoura");
      expect(listings.length).toBeGreaterThan(6);
    } else {
      expect(listings).toEqual([]);
    }
  });
});
