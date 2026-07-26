import { describe, expect, it } from "vitest";
import { resolveExternalSourceUrl } from "@/lib/listings/external-source-url";

describe("resolveExternalSourceUrl", () => {
  it("conserve les URLs https externes", () => {
    expect(
      resolveExternalSourceUrl({
        sourceUrl: "https://www.mubawab.ma/fr/a/123",
        aggregationSource: "mubawab",
      }),
    ).toBe("https://www.mubawab.ma/fr/a/123");
  });

  it("reconstruit Holding si chemin /biens relatif", () => {
    expect(
      resolveExternalSourceUrl({
        sourceUrl: "/biens/villa-test",
        aggregationSource: "holding-immo",
      }),
    ).toBe("https://holdingimmo.com/biens/villa-test");
  });

  it("ne renvoie pas une URL localhost (évite le catalogue local)", () => {
    expect(
      resolveExternalSourceUrl({
        sourceUrl: "http://localhost:3000/fr/biens",
        aggregationSource: "mubawab",
        externalId: "7881114",
      }),
    ).toBe("https://www.mubawab.ma/fr/a/7881114");
  });
});
