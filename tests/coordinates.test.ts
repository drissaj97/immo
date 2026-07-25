import { describe, expect, it } from "vitest";
import { resolveListingCoordinates, isPlaceholderCoordinate } from "@/lib/geography/resolve-coordinates";
import { prepareMapListings } from "@/lib/map/prepare-map-listings";
import type { ListingWithLocation } from "@/server/repositories/listings";

describe("resolve-coordinates", () => {
  it("résout Sala El Jadida au centre du quartier", () => {
    const coords = resolveListingCoordinates({
      city: "Salé",
      neighborhood: "Sala El Jadida",
      latitude: 33.5,
      longitude: -7.5,
    });
    expect(coords.source).toBe("neighborhood");
    expect(coords.latitude).toBeGreaterThan(34);
    expect(coords.longitude).toBeLessThan(-6.7);
  });

  it("conserve coordonnées exactes si présentes", () => {
    const coords = resolveListingCoordinates({
      city: "Casablanca",
      neighborhood: "Anfa",
      latitude: 33.589,
      longitude: -7.664,
    });
    expect(coords.source).toBe("exact");
    expect(coords.latitude).toBe(33.589);
  });

  it("détecte placeholder 33.5/-7.5", () => {
    expect(isPlaceholderCoordinate(33.5, -7.5)).toBe(true);
    expect(isPlaceholderCoordinate(34.04, -6.81)).toBe(false);
  });

  it("résout Victoria / Bouskoura (plus de carte vide)", () => {
    const coords = resolveListingCoordinates({
      city: "Bouskoura",
      neighborhood: "Victoria",
      latitude: 33.5,
      longitude: -7.5,
    });
    expect(coords.source).toBe("neighborhood");
    expect(coords.latitude).toBeGreaterThan(33.4);
    expect(coords.latitude).toBeLessThan(33.5);
    expect(coords.longitude).toBeLessThan(-7.6);
  });
});

describe("prepareMapListings", () => {
  it("filtre les annonces sans coords valides", () => {
    const listing = {
      id: "x",
      title: "Test",
      price: 1000000,
      currency: "MAD",
      location: { city: "Salé", neighborhood: "Sala El Jadida", region: "Rabat-Salé-Kénitra", id: "1", slug: "s" },
      latitude: 33.5,
      longitude: -7.5,
    } as ListingWithLocation;

    const points = prepareMapListings([listing]);
    expect(points.length).toBe(1);
    expect(points[0].coordinateSource).toBe("neighborhood");
  });
});
