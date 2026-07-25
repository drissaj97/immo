import { describe, expect, it } from "vitest";
import { searchListings } from "@/server/repositories/listings";

describe("catalogue public", () => {
  it("exclut les annonces démo par défaut", async () => {
    const { items, total } = await searchListings({ limit: 100 });
    expect(items.every((l) => !l.isDemo)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(50);
  });

  it("inclut les annonces démo avec includeDemo", async () => {
    const without = await searchListings({ limit: 200 });
    const withDemo = await searchListings({ limit: 200, includeDemo: true });
    expect(withDemo.total).toBeGreaterThan(without.total);
    expect(withDemo.items.some((l) => l.isDemo)).toBe(true);
  });

  it("priorise Holding IMMO (photos locales) en tête de liste", async () => {
    const { items } = await searchListings({ limit: 6 });
    expect(items[0]?.aggregationSource).toBe("holding-immo");
    expect(items[0]?.images[0]?.startsWith("/media/holding/")).toBe(true);
  });
});
