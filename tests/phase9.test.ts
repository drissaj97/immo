/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { signToken, verifyToken } from "@/lib/auth/session";
import { createPushProvider, registerPushToken, sendPushToUser } from "@/lib/push/provider";
import { createEmbeddingProvider, resetEmbeddingProviderCache } from "@/modules/ai/embeddings-provider";
import { createLLMProvider } from "@/modules/ai/llm-provider";
import { getStripeCustomerId, setStripeCustomerId } from "@/server/repositories/payments";

describe("Mobile auth JWT", () => {
  it("signe et vérifie un token", async () => {
    const user = {
      id: "user-test",
      email: "test@samsar.demo",
      role: "buyer" as const,
      fullName: "Test User",
    };
    const token = await signToken(user);
    expect(token.split(".")).toHaveLength(3);
    const verified = await verifyToken(token);
    expect(verified?.email).toBe(user.email);
  });
});

describe("Push notifications", () => {
  it("mock provider envoie sans erreur", async () => {
    const provider = createPushProvider();
    expect(provider.name).toBe("mock");
    const result = await provider.send({
      to: "ExponentPushToken[demo]",
      title: "Test",
      body: "Alerte Samsar IA",
    });
    expect(result.success).toBe(true);
  });

  it("register token et send to user", async () => {
    registerPushToken("user-push-test", "ExponentPushToken[abc]");
    const sent = await sendPushToUser("user-push-test", "Alerte", "3 biens trouvés");
    expect(sent).toBe(1);
  });
});

describe("Stripe customer store", () => {
  it("persiste customer id par user", () => {
    setStripeCustomerId("user-stripe", "cus_test123");
    expect(getStripeCustomerId("user-stripe")).toBe("cus_test123");
  });
});

describe("OpenAI providers (when configured)", () => {
  it("LLM provider openai si AI_PROVIDER=openai", () => {
    const prev = process.env.AI_PROVIDER;
    const prevKey = process.env.OPENAI_API_KEY;
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test-key";
    const provider = createLLMProvider();
    expect(provider.name).toBe("openai");
    process.env.AI_PROVIDER = prev;
    process.env.OPENAI_API_KEY = prevKey;
  });

  it("embedding provider openai si AI_PROVIDER=openai", () => {
    resetEmbeddingProviderCache();
    const prevEmb = process.env.EMBEDDING_PROVIDER;
    const prevAi = process.env.AI_PROVIDER;
    const prevKey = process.env.OPENAI_API_KEY;
    delete process.env.EMBEDDING_PROVIDER;
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test-key";
    const provider = createEmbeddingProvider();
    expect(provider.name).toBe("openai");
    expect(provider.dimensions).toBe(1536);
    process.env.EMBEDDING_PROVIDER = prevEmb;
    process.env.AI_PROVIDER = prevAi;
    process.env.OPENAI_API_KEY = prevKey;
    resetEmbeddingProviderCache();
  });
});
