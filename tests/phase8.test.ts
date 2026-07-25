import { describe, expect, it } from "vitest";
import { isStripeConfigured, verifyStripeWebhook } from "@/lib/payment/stripe-client";
import { createPaymentProvider } from "@/lib/payment/provider";
import { mockEmbed, createEmbeddingProvider, resetEmbeddingProviderCache } from "@/modules/ai/embeddings-provider";
import { getEmbeddingIndexStats, getNeighborhoodCount, getUniqueCityCount } from "@/lib/data/embedding-index";
import { getVectorSearchMode } from "@/server/repositories/embeddings-pgvector";
import {
  completePaymentFromWebhook,
  processSubscriptionRenewals,
  seedSubscriptionForBillingTest,
} from "@/server/repositories/payments";

describe("Stripe client", () => {
  it("isStripeConfigured false sans clé", () => {
    expect(isStripeConfigured()).toBe(false);
  });

  it("verifyStripeWebhook rejette signature invalide", () => {
    const payload = JSON.stringify({ type: "test", data: { object: {} } });
    const result = verifyStripeWebhook(payload, "t=123,v1=deadbeef", "whsec_test");
    expect(result).toBeNull();
  });
});

describe("Stripe payment provider", () => {
  it("utilise mock sans STRIPE_SECRET_KEY", async () => {
    const provider = createPaymentProvider();
    expect(provider.name).toBe("mock");
    const result = await provider.createCheckout({
      id: "test-stripe",
      amount: 990,
      currency: "MAD",
      description: "Test Pro",
    });
    expect(result.success).toBe(true);
    expect(result.checkoutUrl).toBeUndefined();
  });
});

describe("Embedding provider", () => {
  it("mock provider génère vecteur 64D", async () => {
    resetEmbeddingProviderCache();
    const provider = createEmbeddingProvider();
    expect(provider.name).toBe("mock");
    expect(provider.dimensions).toBe(64);
    const vec = await provider.embed("appartement Mohammedia");
    expect(vec.length).toBe(64);
  });

  it("mockEmbed déterministe", () => {
    const a = mockEmbed("test", 64);
    const b = mockEmbed("test", 64);
    expect(a).toEqual(b);
  });
});

describe("Geographic expansion 20+", () => {
  it("couvre 20+ quartiers", () => {
    expect(getNeighborhoodCount()).toBeGreaterThanOrEqual(20);
  });

  it("couvre 20+ villes uniques", () => {
    expect(getUniqueCityCount()).toBeGreaterThanOrEqual(20);
  });

  it("index embeddings à jour", () => {
    const stats = getEmbeddingIndexStats();
    expect(stats.neighborhoods).toBeGreaterThanOrEqual(20);
    expect(stats.listings).toBeGreaterThanOrEqual(15);
    expect(stats.provider).toBe("mock");
  });

  it("mode vector search in-memory par défaut", () => {
    expect(getVectorSearchMode()).toBe("in-memory");
  });
});

describe("MRR billing cron", () => {
  it("renouvelle abonnement échu en mode mock", async () => {
    seedSubscriptionForBillingTest("user-billing-test", "investor", true);
    const results = await processSubscriptionRenewals();
    const renewed = results.find((r) => r.userId === "user-billing-test");
    expect(renewed?.status).toBe("renewed");
  });

  it("webhook complete payment", () => {
    const record = completePaymentFromWebhook("cs_test_123", {
      userId: "user-wh-test",
      planId: "pro",
      type: "subscription",
    });
    expect(record?.status).toBe("completed");
    expect(record?.paymentId).toBe("cs_test_123");
  });
});
