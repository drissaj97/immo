import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DEMO_MARKET_METRICS } from "@/lib/data/market-data";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Analytics investisseur",
    description: "Vue d'ensemble des métriques sectorielles par ville et quartier.",
    path: "/dashboard/analytics",
    locale,
  });
}

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getSession();
  if (!user) redirect(`/${locale}/connexion`);

  const sortedByYield = [...DEMO_MARKET_METRICS].sort((a, b) => b.avgYield - a.avgYield);
  const sortedByPrice = [...DEMO_MARKET_METRICS].sort((a, b) => b.avgPricePerSqm - a.avgPricePerSqm);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Analytics investisseur</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>
      <p className="mt-4 text-charcoal/60">Métriques sectorielles fictives — Phase 6 démo.</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-serif text-xl">Top rendements (démo)</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-charcoal/60">
                <th className="py-2">Quartier</th>
                <th className="py-2">Rendement</th>
                <th className="py-2">Prix/m²</th>
              </tr>
            </thead>
            <tbody>
              {sortedByYield.map((m) => (
                <tr key={`${m.city}-${m.neighborhood}`} className="border-b border-charcoal/5">
                  <td className="py-3">
                    {m.neighborhood}, {m.city}
                  </td>
                  <td className="py-3 text-deep-green">{m.avgYield}%</td>
                  <td className="py-3">{m.avgPricePerSqm.toLocaleString("fr-MA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="font-serif text-xl">Prix au m² les plus élevés</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b text-left text-charcoal/60">
                <th className="py-2">Quartier</th>
                <th className="py-2">Prix/m²</th>
                <th className="py-2">Échantillon</th>
              </tr>
            </thead>
            <tbody>
              {sortedByPrice.map((m) => (
                <tr key={`p-${m.city}-${m.neighborhood}`} className="border-b border-charcoal/5">
                  <td className="py-3">
                    {m.neighborhood}, {m.city}
                  </td>
                  <td className="py-3">{m.avgPricePerSqm.toLocaleString("fr-MA")}</td>
                  <td className="py-3 text-charcoal/60">{m.sampleSize} biens</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
