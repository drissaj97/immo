import { describe, expect, it } from "vitest";
import { embedText, cosineSimilarity, searchByEmbedding } from "@/modules/ai/embeddings";
import { searchListingsByEmbedding, getEmbeddingIndexStats } from "@/lib/data/embedding-index";
import { getAffiliateByCode } from "@/lib/data/affiliates";
import { trackReferral, getReferralStats } from "@/server/repositories/affiliates";

describe("Embeddings", () => {
  it("génère un vecteur normalisé", () => {
    const v = embedText("appartement Marrakech Guéliz");
    expect(v.length).toBe(64);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it("similarité plus élevée pour textes proches", () => {
    const a = embedText("villa piscine Marrakech Amelkis");
    const b = embedText("villa prestige golf Amelkis Marrakech");
    const c = embedText("appartement Rabat Hay Riad");
    expect(cosineSimilarity(a, b)).toBeGreaterThan(cosineSimilarity(a, c));
  });

  it("recherche sémantique listings", () => {
    const results = searchListingsByEmbedding("riad Essaouira médina", 3);
    expect(results.length).toBeGreaterThan(0);
  });

  it("index stats", () => {
    const stats = getEmbeddingIndexStats();
    expect(stats.listings).toBeGreaterThan(10);
    expect(stats.neighborhoods).toBeGreaterThan(10);
  });
});

describe("Affiliation", () => {
  it("trouve un code affilié valide", () => {
    expect(getAffiliateByCode("YASMINE2026")?.agentName).toContain("Yasmine");
  });

  it("track visit et stats", () => {
    trackReferral({ affiliateCode: "OMARPRO", event: "visit" });
    const stats = getReferralStats("OMARPRO");
    expect(stats.visits).toBeGreaterThanOrEqual(1);
  });
});
