import { describe, expect, it } from "vitest";
import { hasCompleteLocation } from "@/lib/search/location-gate";
import { cityMatches, neighborhoodMatches } from "@/lib/search/location-match";

describe("location gate", () => {
  it("exige région, ville et quartier", () => {
    expect(
      hasCompleteLocation({ region: "Rabat-Salé-Kénitra", city: "Salé", neighborhood: "Bettana" }),
    ).toBe(true);
    expect(hasCompleteLocation({ region: "Rabat-Salé-Kénitra", city: "Salé" })).toBe(false);
  });
});

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

  it("évite faux positif Sala vs Sala El Jadida", () => {
    const listing = {
      location: { neighborhood: "Sala", city: "Marrakech" },
      title: "Appartement Marrakech",
      description: "Centre ville",
    };
    expect(neighborhoodMatches("Sala El Jadida", listing)).toBe(false);
  });
});
