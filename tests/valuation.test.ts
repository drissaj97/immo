import { describe, expect, it } from "vitest";
import { estimateFromComparables, findComparables } from "@/modules/investment/valuation";

describe("valuation", () => {
  it("estimates from comparables for Technopolis", () => {
    const result = estimateFromComparables(72, "Salé", "Technopolis", "apartment");
    expect(result.estimatedMid).toBeGreaterThan(0);
    expect(result.comparablesUsed.length).toBeGreaterThan(0);
    expect(result.isDemo).toBe(true);
  });

  it("returns spread min/max around mid", () => {
    const result = estimateFromComparables(95, "Marrakech", "Guéliz", "apartment");
    expect(result.estimatedMin).toBeLessThan(result.estimatedMid);
    expect(result.estimatedMax).toBeGreaterThan(result.estimatedMid);
  });

  it("finds comparables by city and neighborhood", () => {
    const comps = findComparables("Marrakech", "Guéliz", 95);
    expect(comps.length).toBeGreaterThan(0);
    expect(comps[0].city).toBe("Marrakech");
  });
});
