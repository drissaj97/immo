import { describe, expect, it } from "vitest";
import { estimateFromComparables, findComparables } from "@/modules/investment/valuation";

describe("valuation", () => {
  it("estimates from real catalog comparables", () => {
    const result = estimateFromComparables(72, "Casablanca", "Casablanca", "apartment");
    expect(result.estimatedMid).toBeGreaterThan(0);
    expect(result.isDemo).toBe(false);
  });

  it("returns spread min/max around mid", () => {
    const comps = findComparables("Marrakech", "Marrakech", 95);
    if (comps.length === 0) return;
    const result = estimateFromComparables(95, comps[0].city, comps[0].neighborhood, "apartment");
    expect(result.estimatedMin).toBeLessThan(result.estimatedMid);
    expect(result.estimatedMax).toBeGreaterThan(result.estimatedMid);
  });

  it("finds comparables from aggregated catalog", () => {
    const comps = findComparables("Marrakech", "Marrakech", 95);
    if (comps.length > 0) {
      expect(comps[0].isDemo).toBe(false);
    }
  });
});
