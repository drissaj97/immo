"use client";

import type { InvestmentScore } from "@/modules/investment/score";

export function InvestmentScoreCard({ score }: { score: InvestmentScore }) {
  const confidenceLabel = {
    high: "Élevé",
    medium: "Moyen",
    low: "Faible",
  }[score.confidence];

  return (
    <div className="rounded-lg border border-charcoal/10 bg-ivory p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-charcoal/60">Score investissement</p>
          <p className="font-serif text-4xl text-deep-green">{score.overall}<span className="text-lg text-charcoal/40">/100</span></p>
        </div>
        <div className="text-right text-xs text-charcoal/60">
          <p>Confiance : {confidenceLabel} ({score.confidencePercent} %)</p>
          <p>{new Date(score.calculatedAt).toLocaleDateString("fr-MA")}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-charcoal/80">{score.summary}</p>

      <div className="mt-4 space-y-2">
        {score.dimensions.slice(0, 6).map((d) => (
          <div key={d.key}>
            <div className="flex justify-between text-xs">
              <span>{d.label}</span>
              <span className="font-medium">{Math.round(d.score)}/100</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-sand overflow-hidden">
              <div
                className="h-full rounded-full bg-deep-green transition-all"
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {score.missingData.length > 0 && (
        <p className="mt-3 text-xs text-bronze">
          Données manquantes : {score.missingData.join(", ")}
        </p>
      )}
      <p className="mt-3 text-xs text-charcoal/50">
        Score transparent — non modifié par le sponsoring. Voir le rapport pour le détail.
      </p>
    </div>
  );
}
