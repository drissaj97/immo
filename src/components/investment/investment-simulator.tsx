"use client";

import { useState } from "react";
import { calculateInvestment, applyScenarioMultiplier, type InvestmentInputs } from "@/modules/investment/calculations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/badge";

const defaultInputs: InvestmentInputs = {
  purchasePrice: 1280000,
  acquisitionFeesRate: 6,
  renovationCost: 50000,
  furnishingCost: 30000,
  downPaymentRate: 30,
  loanRate: 4.5,
  loanYears: 20,
  annualRent: 72000,
  vacancyRate: 8,
  chargesRate: 5,
  maintenanceRate: 1,
  managementRate: 8,
  insuranceAnnual: 2400,
  taxRate: 0,
};

export function InvestmentSimulator({ initialPrice = 1280000 }: { initialPrice?: number }) {
  const [inputs, setInputs] = useState<InvestmentInputs>({ ...defaultInputs, purchasePrice: initialPrice });
  const [scenario, setScenario] = useState<"prudent" | "central" | "optimistic">("central");

  const scenarioInputs = applyScenarioMultiplier(inputs, scenario);
  const results = calculateInvestment(scenarioInputs);

  function setNum(field: keyof InvestmentInputs, value: string) {
    setInputs((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <h2 className="font-serif text-xl">Hypothèses</h2>
        </CardHeader>
        <CardContent className="grid gap-3">
          {[
            ["purchasePrice", "Prix d'achat (MAD)"],
            ["annualRent", "Loyer annuel (MAD)"],
            ["downPaymentRate", "Apport (%)"],
            ["loanRate", "Taux crédit (%)"],
            ["loanYears", "Durée (années)"],
            ["vacancyRate", "Vacance locative (%)"],
          ].map(([field, label]) => (
            <label key={field} className="grid gap-1 text-sm">
              <span className="text-charcoal/70">{label}</span>
              <Input
                type="number"
                value={inputs[field as keyof InvestmentInputs] as number}
                onChange={(e) => setNum(field as keyof InvestmentInputs, e.target.value)}
              />
            </label>
          ))}
          <div className="flex gap-2 pt-2">
            {(["prudent", "central", "optimistic"] as const).map((s) => (
              <Button
                key={s}
                variant={scenario === s ? "default" : "outline"}
                size="sm"
                onClick={() => setScenario(s)}
              >
                {s === "prudent" ? "Prudent" : s === "central" ? "Central" : "Optimiste"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-serif text-xl">Résultats ({scenario})</h2>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <ResultRow label="Coût total acquisition" value={`${results.totalAcquisitionCost.toLocaleString("fr-MA")} MAD`} />
          <ResultRow label="Mensualité crédit" value={`${Math.round(results.monthlyPayment).toLocaleString("fr-MA")} MAD`} />
          <ResultRow label="Rendement brut" value={`${results.grossYield.toFixed(2)} %`} />
          <ResultRow label="Rendement net" value={`${results.netYield.toFixed(2)} %`} highlight />
          <ResultRow label="Cash-flow mensuel" value={`${Math.round(results.monthlyCashFlow).toLocaleString("fr-MA")} MAD`} highlight />
          <ResultRow label="Revenu net annuel" value={`${Math.round(results.netAnnualIncome).toLocaleString("fr-MA")} MAD`} />
          <p className="mt-4 text-xs text-charcoal/50">
            Calculs déterministes — simulations indicatives, non garanties. Paramètres fiscaux configurables.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between border-b border-charcoal/5 py-2 ${highlight ? "font-medium text-deep-green" : ""}`}>
      <span className="text-charcoal/70">{label}</span>
      <span>{value}</span>
    </div>
  );
}
