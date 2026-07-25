import { describe, expect, it } from "vitest";
import {
  getNeighborhoodContext,
  searchNeighborhoodKnowledge,
} from "@/modules/ai/rag";

describe("RAG quartiers", () => {
  it("trouve Guéliz pour une requête Marrakech Guéliz", () => {
    const results = searchNeighborhoodKnowledge("appartement Marrakech Guéliz investissement");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].knowledge.neighborhood).toBe("Guéliz");
  });

  it("trouve Technopolis pour rendement locatif Salé", () => {
    const results = searchNeighborhoodKnowledge("rendement locatif Salé Technopolis");
    expect(results.some((r) => r.knowledge.neighborhood === "Technopolis")).toBe(true);
  });

  it("retourne le contexte par ville et quartier", () => {
    const ctx = getNeighborhoodContext("Bouznika", "Front de mer");
    expect(ctx?.city).toBe("Bouznika");
    expect(ctx?.avgYield).toBeGreaterThan(5);
  });

  it("retourne vide pour requête sans correspondance", () => {
    const results = searchNeighborhoodKnowledge("xi zo");
    expect(results.length).toBe(0);
  });
});
