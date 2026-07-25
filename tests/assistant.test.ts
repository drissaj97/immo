import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/modules/ai/rate-limit";
import { runAssistant } from "@/modules/ai/assistant-service";

describe("rate limit", () => {
  it("allows requests under limit", () => {
    const key = `test-${Date.now()}`;
    const r = checkRateLimit(key, 5);
    expect(r.allowed).toBe(true);
  });
});

describe("DarBladi assistant", () => {
  it("returns structured response in mock mode", async () => {
    const result = await runAssistant(
      "Je cherche un F3 à Salé pour moins de 1 300 000 DH",
      { locale: "fr" },
    );
    expect(result.reply).toBeTruthy();
    expect(result.mode).toBe("mock");
    expect(result.listings?.length).toBeGreaterThan(0);
    expect(result.citations?.length).toBeGreaterThan(0);
  });

  it("includes filters from parser", async () => {
    const result = await runAssistant("Appartement à Marrakech Guéliz", { locale: "fr" });
    expect(result.filters?.city ?? result.filters?.neighborhood).toBeTruthy();
  });
});
