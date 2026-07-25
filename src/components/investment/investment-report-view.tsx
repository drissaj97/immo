import Link from "next/link";
import type { InvestmentReport } from "@/modules/investment/report";
import { formatPrice } from "@/lib/utils";
import { PrintButton } from "./print-button";
import { Badge } from "@/components/ui/badge";
import { InvestmentScoreCard } from "./investment-score-card";
import { PriceHistoryChart } from "./price-history-chart";

export function InvestmentReportView({
  report,
  locale,
}: {
  report: InvestmentReport;
  locale: string;
}) {
  const { listing, scenarios, score } = report;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 print:py-4">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Badge variant="demo">Rapport démo</Badge>
          <h1 className="mt-2 font-serif text-3xl">Rapport d&apos;investissement</h1>
          <p className="text-charcoal/60">{listing.title}</p>
        </div>
        <PrintButton />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 print:grid-cols-2">
        <div className="rounded-lg border border-charcoal/10 p-4">
          <h2 className="font-serif text-xl">Bien analysé</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-charcoal/60">Réf.</dt><dd>{listing.reference}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/60">Prix</dt><dd>{formatPrice(listing.price, listing.currency as "MAD")}</dd></div>
            <div className="flex justify-between"><dt className="text-charcoal/60">Localisation</dt><dd>{listing.neighborhood}, {listing.city}</dd></div>
            {listing.livingArea && (
              <div className="flex justify-between"><dt className="text-charcoal/60">Surface</dt><dd>{listing.livingArea} m²</dd></div>
            )}
          </dl>
        </div>
        <InvestmentScoreCard score={score} />
      </div>

      <section className="mt-8 rounded-lg border border-charcoal/10 p-4">
        <h2 className="font-serif text-xl">Scénarios de rentabilité</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Scénario</th>
              <th>Rendement net</th>
              <th>Cash-flow / mois</th>
            </tr>
          </thead>
          <tbody>
            {(["prudent", "central", "optimistic"] as const).map((s) => (
              <tr key={s} className="border-b border-charcoal/5">
                <td className="py-2 capitalize">{s === "prudent" ? "Prudent" : s === "central" ? "Central" : "Optimiste"}</td>
                <td>{scenarios[s].netYield.toFixed(2)} %</td>
                <td>{Math.round(scenarios[s].monthlyCashFlow).toLocaleString("fr-MA")} MAD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-8 rounded-lg border border-charcoal/10 p-4">
        <PriceHistoryChart history={report.priceHistory} currentPrice={listing.price} />
      </section>

      <section className="mt-8 rounded-lg border border-charcoal/10 p-4">
        <h2 className="font-serif text-xl">Dimensions du score</h2>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Dimension</th>
              <th>Score</th>
              <th>Valeur</th>
            </tr>
          </thead>
          <tbody>
            {score.dimensions.map((d) => (
              <tr key={d.key} className="border-b border-charcoal/5">
                <td className="py-2">{d.label}</td>
                <td>{Math.round(d.score)}/100</td>
                <td className="text-charcoal/70">{d.value ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="mt-8 border-t border-charcoal/10 pt-4 text-xs text-charcoal/50">
        <p>{report.disclaimer}</p>
        <p className="mt-2">Sources : {report.sources.join(" · ")}</p>
        <p>Généré le {new Date(report.generatedAt).toLocaleString("fr-MA")}</p>
        <Link href={`/${locale}/biens/${listing.slug}`} className="mt-4 inline-block text-deep-green print:hidden">
          ← Retour à la fiche
        </Link>
      </footer>
    </div>
  );
}
