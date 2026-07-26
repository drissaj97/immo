import { describe, expect, it } from "vitest";
import { listingMatchesFilters } from "@/lib/search/listing-filters-match";
import { parseListingSearchParams } from "@/lib/search/parse-search-params";
import {
  effectiveTransactionType,
  matchesTransactionFilter,
} from "@/lib/search/effective-transaction-type";
import { inferTransactionType } from "@/lib/scraping/map-listing";

const saleListing = {
  title: "Somptueuse maison a vendre a Ain Diab",
  description: "Vente d'une belle maison",
  transactionType: "sale" as const,
  listingType: "apartment" as const,
  price: 4_500_000,
  location: { city: "Casablanca", neighborhood: "Ain Diab", region: "Casablanca-Settat" },
};

const rentListing = {
  title: "Appartement a louer a Ain Diab",
  description: "Location longue duree",
  transactionType: "long_term_rent" as const,
  listingType: "apartment" as const,
  price: 12_000,
  location: { city: "Casablanca", neighborhood: "Ain Diab", region: "Casablanca-Settat" },
};

const misTaggedSale = {
  title: "Vente d'un bel appartement a Ain Diab Extension",
  description: "A vendre",
  transactionType: "long_term_rent" as const,
  listingType: "apartment" as const,
  price: 1_200_000,
  location: { city: "Casablanca", neighborhood: "Ain Diab", region: "Casablanca-Settat" },
};

/** Cas reel Mubawab Victoria : prix locatif tague vente. */
const misTaggedRentAsSale = {
  title: "Studio 53m avec terrasse bouskoura Victoria",
  description: "Studio meuble",
  transactionType: "sale" as const,
  listingType: "apartment" as const,
  price: 5_500,
  location: { city: "Bouskoura", neighborhood: "Victoria", region: "Casablanca-Settat" },
};

describe("filtre Louer / Acheter", () => {
  it("exclut les annonces a vendre quand on cherche Louer", () => {
    const filters = {
      transactionType: "long_term_rent" as const,
      city: "Casablanca",
      neighborhood: "Ain Diab",
    };
    expect(listingMatchesFilters(saleListing as never, filters)).toBe(false);
    expect(listingMatchesFilters(rentListing as never, filters)).toBe(true);
    expect(listingMatchesFilters(misTaggedSale as never, filters)).toBe(false);
  });

  it("reclasse un studio ~5k MAD tague vente comme location", () => {
    expect(effectiveTransactionType(misTaggedRentAsSale)).toBe("long_term_rent");
    expect(matchesTransactionFilter(misTaggedRentAsSale, "long_term_rent")).toBe(true);
    expect(matchesTransactionFilter(misTaggedRentAsSale, "sale")).toBe(false);

    const rentFilters = {
      transactionType: "long_term_rent" as const,
      city: "Bouskoura",
      neighborhood: "Victoria",
    };
    const saleFilters = {
      transactionType: "sale" as const,
      city: "Bouskoura",
      neighborhood: "Victoria",
    };
    expect(listingMatchesFilters(misTaggedRentAsSale as never, rentFilters)).toBe(true);
    expect(listingMatchesFilters(misTaggedRentAsSale as never, saleFilters)).toBe(false);
  });

  it("ne reclasse pas un terrain bon marche comme location", () => {
    const land = {
      title: "Petit terrain a vendre",
      description: "Terrain nu",
      transactionType: "sale" as const,
      listingType: "land" as const,
      price: 45_000,
    };
    expect(effectiveTransactionType(land)).toBe("sale");
  });

  it("parse les query params avec defaut vente", () => {
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

  it("infere location depuis le prix a l'ingestion", () => {
    expect(
      inferTransactionType("Studio Victoria Victoria", "https://mubawab.ma/fr/a/1", 5_500, "apartment"),
    ).toBe("long_term_rent");
    expect(
      inferTransactionType("Lots de terrains", "https://mubawab.ma/fr/a/2", 2_700_000, "land"),
    ).toBe("sale");
  });
});
