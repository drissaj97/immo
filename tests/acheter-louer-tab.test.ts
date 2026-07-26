import { describe, expect, it } from "vitest";
import { tabFromPathname } from "@/components/search/property-search";
import { mismatchedTransactionRedirect } from "@/lib/search/transaction-page-redirect";

describe("bascule Acheter / Louer", () => {
  it("détecte la page depuis le pathname", () => {
    expect(tabFromPathname("/fr/acheter")).toBe("sale");
    expect(tabFromPathname("/fr/louer")).toBe("long_term_rent");
    expect(tabFromPathname("/fr/acheter/")).toBe("sale");
    expect(tabFromPathname("/fr/biens")).toBeNull();
  });

  it("redirige /acheter?transactionType=long_term_rent vers /louer", () => {
    const href = mismatchedTransactionRedirect(
      "sale",
      {
        transactionType: "long_term_rent",
        city: "Bouskoura",
        neighborhood: "Victoria",
        region: "Casablanca-Settat",
      },
      "fr",
    );
    expect(href).toContain("/fr/louer?");
    expect(href).toContain("transactionType=long_term_rent");
    expect(href).toContain("neighborhood=Victoria");
  });

  it("redirige /louer?transactionType=sale vers /acheter", () => {
    const href = mismatchedTransactionRedirect(
      "long_term_rent",
      { transactionType: "sale", city: "Casablanca" },
      "fr",
    );
    expect(href).toContain("/fr/acheter?");
    expect(href).toContain("transactionType=sale");
  });
});
