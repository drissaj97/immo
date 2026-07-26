import { describe, expect, it } from "vitest";
import { searchListings } from "@/server/repositories/listings";

const SALE_LOCATION = {
  region: "Rabat-Salé-Kénitra",
  city: "Salé",
  neighborhood: "Sala El Jadida",
  transactionType: "sale" as const,
};

describe("catalogue public", () => {
  it("n'affiche que des annonces réelles scrapées/importées", async () => {
    const { items, total } = await searchListings({ ...SALE_LOCATION, limit: 48 });
    expect(items.every((l) => !l.isDemo)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(0);
  });

  it("filtre par quartier Salé — pas de résultats Marrakech", async () => {
    const { items } = await searchListings({ ...SALE_LOCATION, limit: 48 });
    for (const item of items) {
      expect(item.location.city.toLowerCase()).toContain("sal");
    }
    expect(items.some((l) => l.location.city === "Marrakech")).toBe(false);
  });

  it("retourne vide sans quartier", async () => {
    const { items, total } = await searchListings({
      region: "Rabat-Salé-Kénitra",
      city: "Salé",
      limit: 20,
    });
    expect(items).toHaveLength(0);
    expect(total).toBe(0);
  });
});
