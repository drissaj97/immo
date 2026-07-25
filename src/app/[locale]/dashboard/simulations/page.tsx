import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listSimulations, listReports } from "@/server/repositories/investment";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatPrice } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Mes simulations", description: "Simulations d'investissement sauvegardées.", path: "/dashboard/simulations", locale });
}

export default async function SimulationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getSession();
  if (!user) redirect(`/${locale}/connexion`);

  const simulations = listSimulations(user.id);
  const reports = listReports();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Simulations & rapports</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">← Dashboard</Link>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Simulations sauvegardées</h2>
        {simulations.length === 0 ? (
          <p className="mt-4 text-charcoal/60">
            Aucune simulation. <Link href={`/${locale}/simulateur-rentabilite`} className="text-deep-green">Créer une simulation</Link>
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {simulations.map((s) => (
              <li key={s.id} className="rounded-lg border border-charcoal/10 p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-charcoal/60">
                    {s.scenario} · Rendement net {s.results.netYield.toFixed(2)} % · Cash-flow {Math.round(s.results.monthlyCashFlow).toLocaleString("fr-MA")} MAD/mois
                  </p>
                </div>
                <span className="text-sm">{formatPrice(s.inputs.purchasePrice, "MAD")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-xl">Rapports générés (session)</h2>
        {reports.length === 0 ? (
          <p className="mt-4 text-charcoal/60">Générez un rapport depuis une fiche bien.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {reports.map((r) => (
              <li key={r.id}>
                <Link href={`/${locale}/dashboard/rapports/${r.id}`} className="text-deep-green hover:underline">
                  {r.listing.title} — score {r.score.overall}/100
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
