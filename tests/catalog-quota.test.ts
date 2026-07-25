import { describe, expect, it, vi } from "vitest";
import { getListingCatalogStats } from "@/lib/data/catalog";
import { checkOpenAIHealth, MockLLMProvider, ResilientLLMProvider, OpenAILLMProvider } from "@/modules/ai/llm-provider";
import { OpenAIQuotaError } from "@/modules/ai/openai-fetch";

describe("Catalog Holding IMMO", () => {
  it("contient 50+ annonces Holding IMMO importées", async () => {
    const stats = await getListingCatalogStats();
    expect(stats.holdingImmo).toBeGreaterThanOrEqual(50);
    expect(stats.published).toBeGreaterThanOrEqual(60);
    expect(stats.holdingMeta.isFirstParty).toBe(true);
  });

  it("marque isDemo=false pour Holding IMMO", async () => {
    const { HOLDING_LISTINGS } = await import("@/lib/data/holding-listings");
    expect(HOLDING_LISTINGS[0]?.isDemo).toBe(false);
    expect(HOLDING_LISTINGS[0]?.sourceName).toBe("Holding IMMO");
  });
});

describe("OpenAI quota fallback", () => {
  it("ResilientLLMProvider bascule en mock sur quota", async () => {
    const primary = new OpenAILLMProvider("sk-test");
    vi.spyOn(primary, "complete").mockRejectedValue(new OpenAIQuotaError("quota exceeded"));
    const resilient = new ResilientLLMProvider(primary);
    const text = await resilient.complete([{ role: "user", content: "appartement Marrakech Guéliz" }]);
    expect(text).toContain("Critères identifiés");
    expect(resilient.activeMode).toBe("mock-fallback");
  });

  it("checkOpenAIHealth détecte quota_exceeded", async () => {
    const prevKey = process.env.OPENAI_API_KEY;
    const prevProvider = process.env.AI_PROVIDER;
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        clone: () => ({ json: async () => ({ error: { code: "insufficient_quota", message: "quota" } }) }),
        json: async () => ({ error: { code: "insufficient_quota", message: "quota" } }),
      }),
    );

    const health = await checkOpenAIHealth();
    expect(health.status).toBe("quota_exceeded");

    process.env.OPENAI_API_KEY = prevKey;
    process.env.AI_PROVIDER = prevProvider;
    vi.unstubAllGlobals();
  });
});

describe("MockLLMProvider avec raison fallback", () => {
  it("préfixe le message quota", async () => {
    const mock = new MockLLMProvider("quota OpenAI épuisé");
    const text = await mock.complete([{ role: "user", content: "villa Amelkis" }]);
    expect(text).toContain("Mode local");
    expect(text).toContain("quota OpenAI");
  });
});
