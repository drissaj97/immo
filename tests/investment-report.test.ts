import { describe, expect, it } from "vitest";
import { HOLDING_LISTINGS } from "@/lib/data/holding-listings";
import { buildInvestmentReport } from "@/modules/investment/report";

describe("investment report", () => {
  it("builds report with score and scenarios", () => {
    const listing = HOLDING_LISTINGS[0];
    const report = buildInvestmentReport(listing);
    expect(report.score.overall).toBeGreaterThan(0);
    expect(report.scenarios.central.netYield).toBeDefined();
    expect(report.scenarios.prudent.netYield).toBeLessThanOrEqual(report.scenarios.optimistic.netYield);
    expect(report.isDemo).toBe(false);
    expect(report.disclaimer).not.toContain("démonstration");
  });

  it("includes price history", () => {
    const listing = HOLDING_LISTINGS[0];
    const report = buildInvestmentReport(listing);
    expect(report.priceHistory.length).toBeGreaterThanOrEqual(2);
  });
});
