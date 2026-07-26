import { describe, expect, it } from "vitest";
import { listingMatchesFilters } from "@/lib/search/listing-filters-match";
import { parseListingSearchParams } from "@/lib/search/parse-search-params";

// Fixtures
const saleListing = {
  title: "Somptueuse maison à vendre à Ain Diab",
  description: "Vente d'une belle maison",
  transactionType: "sale" as const,
  listingType: "apartment" as const,
  price: 4_500_000,
  location: { city: "Casablanca", neighborhood: "Ain Diab", region: "Casablanca-Settat" },
};

const rentListing = {
  title: "Appartement à louer à Ain Diab",
  description: "Location longue durée",
  transactionType: "long_term_rent" as const,
  listingType: "apartment" as const,
  price: 12_000,
  location: { city: "Casablanca", neighborhood: "Ain Diab", region: "Casablanca-Settat" },
};

const misTaggedSale = {
  title: "Vente d'un bel appartement à Ain Diab Extension",
  description: "À vendre",
  transactionType: "long_term_rent" as const, // mauvais tag
  listingType: "apartment" as const,
  price: 1_200_000,
  location: { city: "Casablanca", neighborhood: "Ain Diab", region: "Casablanca-Settat" },
};

describe("filtre Louer / Acheter", () => {
  it("exclut les annonces à vendre quand on cherche Louer", () => {
    const filters = { transactionType: "long_term_rent" as const, city: "Casablanca", neighborhood: "Ain Diab" };
    expect(listingMatchesFilters(saleListing as never, filters)).toBe(false);
    expect(listingMatchesFilters(rentListing as never, filters)).toBe(true);
    expect(listingMatchesFilters(misTaggedSale as never, filters)).toBe(false);
  });

  it("parse les query params avec défaut vente", () => {
    const parsed = parseListingSearchParams(
      { region: "Casablanca-Settat", city: "Casablanca", neighborhood: "Ain Diab" },
      { transactionType: "sale" },
    );
    expect(parsed.transactionType).toBe("sale");

    const rent = parseListingSearchParams({
      transactionType: "long_term_rent",
      city: "Casablanca",
    });
    expect(rent.transactionType).toBe("long_term_rent");
  });
});
