import { describe, expect, it } from "vitest";
import {
  calculateInvestment,
  calculateMonthlyPayment,
  applyScenarioMultiplier,
} from "@/modules/investment/calculations";

describe("investment calculations", () => {
  it("calculates monthly payment", () => {
    const payment = calculateMonthlyPayment(700000, 4.5, 20);
    expect(payment).toBeGreaterThan(4000);
    expect(payment).toBeLessThan(6000);
  });

  it("calculates net yield and cash flow", () => {
    const results = calculateInvestment({
      purchasePrice: 1000000,
      acquisitionFeesRate: 6,
      renovationCost: 0,
      furnishingCost: 0,
      downPaymentRate: 30,
      loanRate: 4.5,
      loanYears: 20,
      annualRent: 60000,
      vacancyRate: 8,
      chargesRate: 5,
      maintenanceRate: 1,
      managementRate: 8,
      insuranceAnnual: 2000,
      taxRate: 0,
    });
    expect(results.grossYield).toBeGreaterThan(0);
    expect(results.netYield).toBeLessThan(results.grossYield);
    expect(results.monthlyCashFlow).toBeDefined();
  });

  it("applies scenario multipliers", () => {
    const base = {
      purchasePrice: 1000000,
      acquisitionFeesRate: 6,
      renovationCost: 0,
      furnishingCost: 0,
      downPaymentRate: 30,
      loanRate: 4.5,
      loanYears: 20,
      annualRent: 60000,
      vacancyRate: 8,
      chargesRate: 5,
      maintenanceRate: 1,
      managementRate: 8,
      insuranceAnnual: 2000,
      taxRate: 0,
    };
    const prudent = applyScenarioMultiplier(base, "prudent");
    const optimistic = applyScenarioMultiplier(base, "optimistic");
    expect(prudent.annualRent).toBeLessThan(base.annualRent);
    expect(optimistic.annualRent).toBeGreaterThan(base.annualRent);
  });
});
