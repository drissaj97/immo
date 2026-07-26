import { describe, expect, it } from "vitest";
import {
  getNeighborhoodContext,
  searchNeighborhoodKnowledge,
} from "@/modules/ai/rag";

describe("RAG quartiers", () => {
  it("trouve Marrakech Guéliz pour une requête investissement", () => {
    const results = searchNeighborhoodKnowledge("appartement Marrakech Guéliz investissement");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].knowledge.city.toLowerCase()).toContain("marrakech");
    expect(
      results[0].knowledge.neighborhood.toLowerCase().replace(/é/g, "e"),
    ).toContain("gueliz");
  });

  it("trouve un quartier pour rendement locatif Salé", () => {
    const results = searchNeighborhoodKnowledge("rendement locatif Salé");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.knowledge.city.toLowerCase().includes("sal"))).toBe(true);
  });

  it("retourne le contexte par ville et quartier du catalogue", () => {
    const results = searchNeighborhoodKnowledge("Casablanca appartement");
    expect(results.length).toBeGreaterThan(0);
    const ctx = getNeighborhoodContext(results[0].knowledge.city, results[0].knowledge.neighborhood);
    expect(ctx?.city).toBeTruthy();
    expect(ctx?.isDemo).toBe(false);
  });

  it("retourne vide pour requête sans correspondance", () => {
    const results = searchNeighborhoodKnowledge("xi zo");
    expect(results.length).toBe(0);
  });
});
