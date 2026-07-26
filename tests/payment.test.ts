import { describe, expect, it } from "vitest";
import { calculateDepositAmount, getPlanById } from "@/lib/data/plans";
import { createPaymentProvider } from "@/lib/payment/provider";

describe("Plans & deposits", () => {
  it("calcule 5% avec minimum 5000 MAD", () => {
    expect(calculateDepositAmount(50_000)).toBe(5_000);
    expect(calculateDepositAmount(200_000)).toBe(10_000);
  });

  it("plafonne à 50 000 MAD", () => {
    expect(calculateDepositAmount(2_000_000)).toBe(50_000);
  });

  it("retourne le plan pro", () => {
    const plan = getPlanById("pro");
    expect(plan?.priceMonthly).toBe(990);
    expect(plan?.features.length).toBeGreaterThan(2);
  });
});

describe("Payment provider mock", () => {
  it("crée un paiement mock réussi", async () => {
    const provider = createPaymentProvider();
    expect(provider.name).toBe("mock");
    const result = await provider.createCheckout({
      id: "test-1",
      amount: 5000,
      currency: "MAD",
      description: "Test deposit",
    });
    expect(result.success).toBe(true);
    expect(result.paymentId).toMatch(/^pay_mock_/);
  });
});
