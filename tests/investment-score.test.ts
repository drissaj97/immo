import { describe, expect, it } from "vitest";
import { HOLDING_LISTINGS } from "@/lib/data/holding-listings";
import { calculateInvestmentScore } from "@/modules/investment/score";
import { findMarketMetric } from "@/modules/investment/valuation";

describe("investment score", () => {
  const listing = HOLDING_LISTINGS.find((l) => l.livingArea && l.livingArea > 0)!;

  it("returns score between 0 and 100", () => {
    const market = findMarketMetric(listing.location.city, listing.location.neighborhood, listing.listingType);
    const score = calculateInvestmentScore(listing, market);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
  });

  it("includes dimensions with explanations", () => {
    const score = calculateInvestmentScore(listing, null);
    expect(score.dimensions.length).toBeGreaterThanOrEqual(8);
    expect(score.dimensions.every((d) => d.explanation.length > 0)).toBe(true);
  });

  it("never exceeds 100 on weighted average", () => {
    const score = calculateInvestmentScore(listing, null);
    const manual = Math.round(
      score.dimensions.reduce((s, d) => s + d.score * d.weight, 0) /
        score.dimensions.reduce((s, d) => s + d.weight, 0),
    );
    expect(score.overall).toBe(manual);
  });

  it("ne révèle pas le nom de source partenaire au public", () => {
    const partnerListing = {
      ...listing,
      sourceName: "Mubawab.ma",
      isVerified: false,
    };
    const publicScore = calculateInvestmentScore(partnerListing, null);
    const cred = publicScore.dimensions.find((d) => d.key === "seller_credibility");
    expect(cred?.value).toBe("Annonceur");
    expect(String(cred?.value)).not.toMatch(/Mubawab|Avito|Sarouty/i);

    const adminScore = calculateInvestmentScore(partnerListing, null, undefined, {
      revealSources: true,
    });
    expect(adminScore.dimensions.find((d) => d.key === "seller_credibility")?.value).toBe(
      "Mubawab.ma",
    );
  });
});
