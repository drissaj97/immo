import { describe, expect, it } from "vitest";
import { convertPrice } from "@/server/repositories/listings";

describe("currency conversion", () => {
  it("converts MAD to EUR indicatively", () => {
    const result = convertPrice(1000000, "MAD", "EUR");
    expect(result.amount).toBeGreaterThan(80000);
    expect(result.source).toContain("Banque");
  });

  it("keeps same currency unchanged ratio", () => {
    const result = convertPrice(500000, "MAD", "MAD");
    expect(result.amount).toBe(500000);
    expect(result.rate).toBe(1);
  });
});
