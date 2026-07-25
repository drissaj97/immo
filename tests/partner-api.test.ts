import { describe, expect, it } from "vitest";
import { authenticatePartner, extractApiKey } from "@/lib/api/partner-auth";
import { checkRateLimit } from "@/lib/api/rate-limit";

describe("Partner API auth", () => {
  it("extrait la clé du header X-API-Key", () => {
    const req = new Request("http://localhost/api/v1/listings", {
      headers: { "X-API-Key": "samsar-demo-partner-key" },
    });
    expect(extractApiKey(req)).toBe("samsar-demo-partner-key");
  });

  it("extrait la clé Bearer", () => {
    const req = new Request("http://localhost/api/v1/listings", {
      headers: { Authorization: "Bearer samsar-demo-partner-key" },
    });
    expect(extractApiKey(req)).toBe("samsar-demo-partner-key");
  });

  it("authentifie la clé démo", () => {
    const req = new Request("http://localhost/api/v1/listings", {
      headers: { "X-API-Key": "samsar-demo-partner-key" },
    });
    const partner = authenticatePartner(req);
    expect(partner?.partnerName).toBe("Partenaire Démo");
  });

  it("rejette une clé invalide", () => {
    const req = new Request("http://localhost/api/v1/listings", {
      headers: { "X-API-Key": "invalid-key" },
    });
    expect(authenticatePartner(req)).toBeNull();
  });
});

describe("Rate limiting", () => {
  it("autorise les requêtes sous la limite", () => {
    const key = `test-${Date.now()}`;
    const r1 = checkRateLimit(key, 5, 60_000);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(4);
  });

  it("bloque au-delà de la limite", () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000);
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
  });
});
