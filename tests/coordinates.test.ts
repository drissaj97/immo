import { describe, expect, it } from "vitest";
import {
  resolveListingCoordinates,
  isPlaceholderCoordinate,
  isValidMoroccoCoordinate,
} from "@/lib/geography/resolve-coordinates";
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
    expect(isValidMoroccoCoordinate(coords.latitude, coords.longitude)).toBe(true);
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

  it("détecte placeholder 33.5/-7.5 et Null Island 0,0", () => {
    expect(isPlaceholderCoordinate(33.5, -7.5)).toBe(true);
    expect(isPlaceholderCoordinate(0, 0)).toBe(true);
    expect(isValidMoroccoCoordinate(0, 0)).toBe(false);
    expect(isPlaceholderCoordinate(34.04, -6.81)).toBe(false);
  });

  it("rejette 0,0 stocké et replace par le centroïde Salé", () => {
    const coords = resolveListingCoordinates({
      city: "Salé",
      neighborhood: "Salé",
      latitude: 0,
      longitude: 0,
    });
    expect(coords.source).not.toBe("exact");
    expect(isValidMoroccoCoordinate(coords.latitude, coords.longitude)).toBe(true);
    expect(coords.latitude).toBeGreaterThan(33.5);
    expect(coords.longitude).toBeLessThan(-6);
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

  it("n'affiche pas un marqueur en océan (0,0) hors zone de recherche", () => {
    const ocean = {
      id: "ocean",
      title: "Appartement 130m² A VENDRE à Sala AL JADIDA",
      price: 1200000,
      currency: "MAD",
      slug: "appart-sala",
      location: { city: "Salé", neighborhood: "Salé", region: "Rabat-Salé-Kénitra", id: "1", slug: "s" },
      latitude: 0,
      longitude: 0,
    } as ListingWithLocation;

    const farAway = {
      id: "agadir",
      title: "Villa Agadir",
      price: 530000,
      currency: "MAD",
      slug: "villa-agadir",
      location: { city: "Agadir", neighborhood: "Founty", region: "Souss-Massa", id: "2", slug: "a" },
      latitude: 30.41,
      longitude: -9.6,
    } as ListingWithLocation;

    const points = prepareMapListings([ocean, farAway], {
      searchCity: "Salé",
      searchNeighborhood: "Sala El Jadida",
      maxDistanceKm: 18,
    });

    expect(points.every((p) => isValidMoroccoCoordinate(p.mapLatitude, p.mapLongitude))).toBe(true);
    expect(points.some((p) => Math.abs(p.mapLatitude) < 0.1 && Math.abs(p.mapLongitude) < 0.1)).toBe(
      false,
    );
    expect(points.some((p) => p.id === "agadir")).toBe(false);
    expect(points.some((p) => p.id === "ocean")).toBe(true);
    expect(points.find((p) => p.id === "ocean")!.mapLatitude).toBeGreaterThan(33.5);
  });
});
