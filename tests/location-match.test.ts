import { describe, expect, it } from "vitest";
import { cityMatches, neighborhoodMatches } from "@/lib/search/location-match";

describe("location-match", () => {
  it("compare villes avec accents", () => {
    expect(cityMatches("Salé", "Sale")).toBe(true);
    expect(cityMatches("Kénitra", "Kenitra")).toBe(true);
  });

  it("matche quartier via titre si quartier API différent", () => {
    const listing = {
      location: { neighborhood: "Tabriquet", city: "Salé" },
      title: "Appartement à louer à Bettana",
      description: "Situé à Bettana près de la marina",
    };
    expect(neighborhoodMatches("Bettana", listing)).toBe(true);
  });
});
