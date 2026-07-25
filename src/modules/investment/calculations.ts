export type InvestmentInputs = {
  purchasePrice: number;
  acquisitionFeesRate: number;
  renovationCost: number;
  furnishingCost: number;
  downPaymentRate: number;
  loanRate: number;
  loanYears: number;
  annualRent: number;
  vacancyRate: number;
  chargesRate: number;
  maintenanceRate: number;
  managementRate: number;
  insuranceAnnual: number;
  taxRate: number;
  /** Location saisonnière */
  nightlyRate?: number;
  occupancyRate?: number;
  isSeasonal?: boolean;
};

export type InvestmentResults = {
  totalAcquisitionCost: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalCreditCost: number;
  grossYield: number;
  netAnnualIncome: number;
  netYield: number;
  monthlyCashFlow: number;
  capRate: number;
  pricePerSqm?: number;
  livingArea?: number;
};

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number,
): number {
  if (principal <= 0) return 0;
  if (annualRate <= 0) return principal / (years * 12);
  const monthlyRate = annualRate / 100 / 12;
  const n = years * 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
}

export function calculateAnnualRent(inputs: InvestmentInputs): number {
  if (inputs.isSeasonal && inputs.nightlyRate && inputs.occupancyRate !== undefined) {
    return inputs.nightlyRate * (inputs.occupancyRate / 100) * 365;
  }
  return inputs.annualRent;
}

export function calculateInvestment(
  inputs: InvestmentInputs,
  livingArea?: number,
): InvestmentResults {
  const acquisitionFees = inputs.purchasePrice * (inputs.acquisitionFeesRate / 100);
  const totalAcquisitionCost =
    inputs.purchasePrice + acquisitionFees + inputs.renovationCost + inputs.furnishingCost;

  const downPayment = totalAcquisitionCost * (inputs.downPaymentRate / 100);
  const loanAmount = totalAcquisitionCost - downPayment;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, inputs.loanRate, inputs.loanYears);
  const totalCreditCost = monthlyPayment * inputs.loanYears * 12;

  const annualRent = calculateAnnualRent(inputs);
  const vacancy = annualRent * (inputs.vacancyRate / 100);
  const charges = annualRent * (inputs.chargesRate / 100);
  const maintenance = inputs.purchasePrice * (inputs.maintenanceRate / 100);
  const management = annualRent * (inputs.managementRate / 100);
  const tax = annualRent * (inputs.taxRate / 100);

  const netAnnualIncome =
    annualRent - vacancy - charges - maintenance - management - inputs.insuranceAnnual - tax;

  const grossYield = totalAcquisitionCost > 0 ? (annualRent / totalAcquisitionCost) * 100 : 0;
  const netYield = totalAcquisitionCost > 0 ? (netAnnualIncome / totalAcquisitionCost) * 100 : 0;
  const monthlyCashFlow = netAnnualIncome / 12 - monthlyPayment;
  const capRate = inputs.purchasePrice > 0 ? (netAnnualIncome / inputs.purchasePrice) * 100 : 0;

  return {
    totalAcquisitionCost,
    downPayment,
    loanAmount,
    monthlyPayment,
    totalCreditCost,
    grossYield,
    netAnnualIncome,
    netYield,
    monthlyCashFlow,
    capRate,
    pricePerSqm: livingArea ? inputs.purchasePrice / livingArea : undefined,
    livingArea,
  };
}

export function applyScenarioMultiplier(base: InvestmentInputs, scenario: "prudent" | "central" | "optimistic"): InvestmentInputs {
  const multipliers = {
    prudent: { rent: 0.85, vacancy: 1.3, occupancy: 0.85 },
    central: { rent: 1, vacancy: 1, occupancy: 1 },
    optimistic: { rent: 1.15, vacancy: 0.7, occupancy: 1.1 },
  }[scenario];

  return {
    ...base,
    annualRent: base.annualRent * multipliers.rent,
    vacancyRate: Math.min(100, base.vacancyRate * multipliers.vacancy),
    occupancyRate: base.occupancyRate ? base.occupancyRate * multipliers.occupancy : base.occupancyRate,
    nightlyRate: base.nightlyRate ? base.nightlyRate * multipliers.rent : base.nightlyRate,
  };
}
