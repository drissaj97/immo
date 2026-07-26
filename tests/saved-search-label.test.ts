import { describe, expect, it } from "vitest";
import {
  buildSavedSearchName,
  formatFiltersSummary,
  resultsPathForFilters,
} from "@/lib/search/saved-search-label";

describe("saved-search-label", () => {
  it("nomme une recherche location avec quartier", () => {
    expect(
      buildSavedSearchName({
        transactionType: "long_term_rent",
        city: "Bouskoura",
        neighborhood: "Victoria",
      }),
    ).toBe("Louer · Victoria, Bouskoura");
  });

  it("nomme une recherche vente", () => {
    expect(
      buildSavedSearchName({
        transactionType: "sale",
        city: "Marrakech",
        neighborhood: "Gueliz",
      }),
    ).toBe("Acheter · Gueliz, Marrakech");
  });

  it("construit le chemin resultats", () => {
    expect(
      resultsPathForFilters("fr", {
        transactionType: "long_term_rent",
        city: "Bouskoura",
        neighborhood: "Victoria",
      }),
    ).toContain("/fr/louer?");
  });

  it("resume les filtres", () => {
    expect(
      formatFiltersSummary({
        region: "Casablanca-Settat",
        city: "Bouskoura",
        neighborhood: "Victoria",
        minPrice: 3000,
        maxPrice: 8000,
      }),
    ).toContain("Victoria");
  });
});
