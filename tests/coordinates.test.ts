import { describe, expect, it } from "vitest";
import {
  resolveListingCoordinates,
  isPlaceholderCoordinate,
  isValidMoroccoCoordinate,
  distanceKm,
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
      description: "",
      location: { city: "Salé", neighborhood: "Sala El Jadida", region: "Rabat-Salé-Kénitra", id: "1", slug: "s" },
      latitude: 33.5,
      longitude: -7.5,
    } as ListingWithLocation;

    const points = prepareMapListings([listing]);
    expect(points.length).toBe(1);
    expect(points[0].coordinateSource).toBe("neighborhood");
  });

  it("ramène un outlier océan (coords foireuses) au centre Temara", () => {
    const ocean = {
      id: "ocean-temara",
      title: "Appartement 97m2 wifak bien situe residence fermee et securisee",
      price: 1_400_000,
      currency: "MAD",
      slug: "appart-wifak",
      description: "wifak temara",
      location: {
        city: "Temara",
        neighborhood: "Temara",
        region: "Rabat-Salé-Kénitra",
        id: "1",
        slug: "t",
      },
      // Lat/lng type océan Golfe de Guinée
      latitude: -6.9,
      longitude: -6.9,
    } as ListingWithLocation;

    const search = resolveListingCoordinates({
      city: "Temara",
      neighborhood: "Temara",
    });

    const points = prepareMapListings([ocean], {
      searchCity: "Temara",
      searchNeighborhood: "Temara",
      maxDistanceKm: 10,
    });

    expect(points).toHaveLength(1);
    const pin = points[0]!;
    expect(isValidMoroccoCoordinate(pin.mapLatitude, pin.mapLongitude)).toBe(true);
    expect(
      distanceKm(
        { lat: search.latitude, lng: search.longitude },
        { lat: pin.mapLatitude, lng: pin.mapLongitude },
      ),
    ).toBeLessThan(10);
    expect(pin.coordinateSource).not.toBe("exact");
  });

  it("place l'annonce dans le quartier recherché (pas en océan ni hors zone)", () => {
    const ocean = {
      id: "ocean",
      title: "Appartement 130m² A VENDRE à Sala AL JADIDA",
      price: 1200000,
      currency: "MAD",
      slug: "appart-sala",
      description: "Sala al jadida",
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
      description: "Founty",
      location: { city: "Agadir", neighborhood: "Founty", region: "Souss-Massa", id: "2", slug: "a" },
      latitude: 30.41,
      longitude: -9.6,
    } as ListingWithLocation;

    const search = resolveListingCoordinates({
      city: "Salé",
      neighborhood: "Sala El Jadida",
    });

    const points = prepareMapListings([ocean, farAway], {
      searchCity: "Salé",
      searchNeighborhood: "Sala El Jadida",
      maxDistanceKm: 8,
    });

    expect(points.some((p) => p.id === "agadir")).toBe(false);
    expect(points.some((p) => p.id === "ocean")).toBe(true);

    const pin = points.find((p) => p.id === "ocean")!;
    expect(isValidMoroccoCoordinate(pin.mapLatitude, pin.mapLongitude)).toBe(true);
    expect(
      distanceKm(
        { lat: search.latitude, lng: search.longitude },
        { lat: pin.mapLatitude, lng: pin.mapLongitude },
      ),
    ).toBeLessThan(8);
  });
});
