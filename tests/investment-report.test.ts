import { describe, expect, it } from "vitest";
import { DEMO_LISTINGS } from "@/lib/data/demo-data";
import { buildInvestmentReport } from "@/modules/investment/report";

describe("investment report", () => {
  it("builds report with score and scenarios", () => {
    const listing = DEMO_LISTINGS[0];
    const report = buildInvestmentReport(listing);
    expect(report.score.overall).toBeGreaterThan(0);
    expect(report.scenarios.central.netYield).toBeDefined();
    expect(report.scenarios.prudent.netYield).toBeLessThanOrEqual(report.scenarios.optimistic.netYield);
    expect(report.isDemo).toBe(true);
    expect(report.disclaimer).toContain("démonstration");
  });

  it("includes price history", () => {
    const listing = DEMO_LISTINGS.find((l) => l.reference === "SA-D001")!;
    const report = buildInvestmentReport(listing);
    expect(report.priceHistory.length).toBeGreaterThanOrEqual(2);
  });
});
