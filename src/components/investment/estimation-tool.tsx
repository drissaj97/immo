"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { estimateFromComparables } from "@/modules/investment/valuation";
import { formatPrice } from "@/lib/utils";

export function EstimationTool() {
  const [city, setCity] = useState("Salé");
  const [neighborhood, setNeighborhood] = useState("Technopolis");
  const [listingType, setListingType] = useState("apartment");
  const [livingArea, setLivingArea] = useState(72);
  const [result, setResult] = useState<ReturnType<typeof estimateFromComparables> | null>(null);

  function estimate() {
    setResult(estimateFromComparables(livingArea, city, neighborhood, listingType));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          Ville
          <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
        </label>
        <label className="text-sm">
          Quartier
          <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="mt-1" />
        </label>
        <label className="text-sm">
          Surface (m²)
          <Input type="number" value={livingArea} onChange={(e) => setLivingArea(Number(e.target.value))} className="mt-1" />
        </label>
        <label className="text-sm">
          Type
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            className="mt-1 flex h-10 w-full rounded-md border border-charcoal/15 px-3 text-sm"
          >
            <option value="apartment">Appartement</option>
            <option value="villa">Villa</option>
          </select>
        </label>
      </div>
      <Button onClick={estimate}>Estimer</Button>

      {result && (
        <div className="rounded-lg border border-charcoal/10 p-6 space-y-4">
          <Badge variant="demo">Estimation fictive</Badge>
          <p className="font-serif text-2xl text-deep-green">
            {formatPrice(result.estimatedMin, "MAD")} — {formatPrice(result.estimatedMax, "MAD")}
          </p>
          <p className="text-sm text-charcoal/70">
            Valeur médiane : {formatPrice(result.estimatedMid, "MAD")} · {result.pricePerSqm.toLocaleString("fr-MA")} MAD/m²
          </p>
          <p className="text-sm">{result.methodology}</p>
          <p className="text-xs text-charcoal/50">Confiance : {result.confidence}</p>

          {result.comparablesUsed.length > 0 && (
            <div>
              <h3 className="font-medium text-sm mb-2">Comparables utilisés</h3>
              <ul className="text-sm space-y-1 text-charcoal/70">
                {result.comparablesUsed.map((c) => (
                  <li key={c.id}>
                    {c.title} — {c.pricePerSqm.toLocaleString("fr-MA")} MAD/m² ({c.livingArea} m²)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
