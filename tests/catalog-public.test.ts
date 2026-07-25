import { describe, expect, it } from "vitest";
import { searchListings } from "@/server/repositories/listings";

describe("catalogue public", () => {
  it("exclut les annonces démo par défaut", async () => {
    const { items, total } = await searchListings({ limit: 100 });
    expect(items.every((l) => !l.isDemo)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(100);
  });

  it("inclut les annonces démo avec includeDemo", async () => {
    const without = await searchListings({ limit: 200 });
    const withDemo = await searchListings({ limit: 200, includeDemo: true });
    expect(withDemo.total).toBeGreaterThan(without.total);
    expect(withDemo.items.some((l) => l.isDemo)).toBe(true);
  });
});
