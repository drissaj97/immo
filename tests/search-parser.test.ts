import { describe, expect, it } from "vitest";
import { parseNaturalLanguageQuery } from "@/modules/search/natural-language-parser";

describe("natural language parser", () => {
  it("parses F3 in Salé with budget", () => {
    const result = parseNaturalLanguageQuery(
      "Je cherche un F3 à Salé proche de Technopolis pour moins de 1 300 000 DH",
    );
    expect(result.filters.city).toBe("Salé");
    expect(result.filters.neighborhood).toBe("Technopolis");
    expect(result.filters.region).toBe("Rabat-Salé-Kénitra");
    expect(result.filters.maxPrice).toBe(1300000);
    expect(result.filters.listingType).toBe("apartment");
  });

  it("parses Sala El Jadida as Salé neighborhood", () => {
    const result = parseNaturalLanguageQuery("je cherche F3 à sala el jadida");
    expect(result.filters.city).toBe("Salé");
    expect(result.filters.neighborhood).toBe("Sala El Jadida");
    expect(result.filters.region).toBe("Rabat-Salé-Kénitra");
    expect(result.missing).not.toContain("Quartier");
  });

  it("detects seasonal rent intent", () => {
    const result = parseNaturalLanguageQuery(
      "Appartement Airbnb rentable à Marrakech",
    );
    expect(result.filters.transactionType).toBe("seasonal_rent");
    expect(result.missing).toContain("Quartier");
  });

  it("reports missing quartier when only city detected", () => {
    const result = parseNaturalLanguageQuery("Villa avec piscine à Marrakech");
    expect(result.missing).toContain("Quartier");
  });

  it("reports missing city when absent", () => {
    const result = parseNaturalLanguageQuery("Villa avec piscine");
    expect(result.missing).toContain("Ville");
    expect(result.missing).toContain("Quartier");
  });
});
