import { describe, expect, it } from "vitest";
import { searchListings } from "@/server/repositories/listings";

describe("catalogue public", () => {
  it("n'affiche que des annonces réelles scrapées/importées", async () => {
    const { items, total } = await searchListings({ limit: 200 });
    expect(items.every((l) => !l.isDemo)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(5000);
  });

  it("priorise les sources agrégées (semsarai, holding-immo)", async () => {
    const { items } = await searchListings({ limit: 20 });
    const sources = new Set(items.map((l) => l.aggregationSource).filter(Boolean));
    expect(sources.has("semsarai") || sources.has("holding-immo")).toBe(true);
  });
});
