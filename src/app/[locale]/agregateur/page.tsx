import Link from "next/link";
import { getAggregationStats } from "@/lib/aggregation/sync";
import { AGGREGATION_SOURCES } from "@/lib/aggregation/sources/registry";
import { buildMetadata } from "@/lib/seo/metadata";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Agrégateur immobilier — Toutes les annonces du Maroc",
    description:
      "Samsar IA agrège les annonces immobilières du Maroc depuis des sources autorisées : agences partenaires, Avito, Mubawab.",
    path: "/agregateur",
    locale,
  });
}

const STATUS_LABELS: Record<string, string> = {
  first_party: "First-party",
  partner_contract: "Contrat partenaire",
  licensed_api: "API licenciée",
  pending: "Partenariat requis",
  disabled: "Désactivé",
};

export default async function AgregateurPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const stats = await getAggregationStats();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-4xl">Toutes les annonces du Maroc</h1>
      <p className="mt-4 text-lg text-charcoal/70">
        Samsar IA agrège les biens immobiliers depuis plusieurs sources — avec provenance explicite et liens vers
        l&apos;annonce originale.
      </p>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-charcoal/10 p-6 text-center">
          <p className="text-3xl font-bold text-deep-green">{stats.published}</p>
          <p className="mt-1 text-sm text-charcoal/60">Annonces publiées</p>
        </div>
        <div className="rounded-lg border border-charcoal/10 p-6 text-center">
          <p className="text-3xl font-bold text-deep-green">{stats.cities}</p>
          <p className="mt-1 text-sm text-charcoal/60">Villes couvertes</p>
        </div>
        <div className="rounded-lg border border-charcoal/10 p-6 text-center">
          <p className="text-3xl font-bold text-deep-green">{Object.keys(stats.bySource).length}</p>
          <p className="mt-1 text-sm text-charcoal/60">Sources actives</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl">Sources agrégées</h2>
        <ul className="mt-6 space-y-4">
          {AGGREGATION_SOURCES.map((source) => {
            const count = stats.bySource[source.id] ?? 0;
            return (
              <li
                key={source.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-charcoal/10 p-5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{source.name}</h3>
                    <Badge variant={source.enabled && count > 0 ? "verified" : "demo"}>
                      {STATUS_LABELS[source.licenseStatus]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-charcoal/60">{source.description}</p>
                  <a
                    href={source.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-deep-green hover:underline"
                  >
                    {source.website}
                  </a>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-deep-green">{count}</p>
                  <p className="text-xs text-charcoal/50">annonces</p>
                  {count > 0 && (
                    <Link
                      href={`/${locale}/biens?source=${source.id}`}
                      className="mt-2 inline-block text-sm text-deep-green hover:underline"
                    >
                      Parcourir →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12 rounded-lg border border-amber-200 bg-amber-50/60 p-6">
        <h2 className="font-serif text-xl">Activer Avito & Mubawab</h2>
        <p className="mt-3 text-sm text-charcoal/80">
          Le scraping direct est interdit par les CGU. Pour agréger <strong>toutes</strong> les annonces Avito et
          Mubawab, trois voies conformes :
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-charcoal/80">
          <li>
            <strong>Partenariat officiel</strong> — contact commercial Avito / Dubizzle Group (Mubawab)
          </li>
          <li>
            <strong>PropAPIS</strong> — agrégateur licencié (<code>PROPAPIS_API_KEY</code>)
          </li>
          <li>
            <strong>Flux JSON partenaire</strong> — déposer <code>data/feeds/avito.json</code> ou{" "}
            <code>mubawab.json</code>
          </li>
        </ol>
        <p className="mt-4 text-sm">
          Documentation :{" "}
          <Link href={`/${locale}/developpeurs`} className="text-deep-green hover:underline">
            API développeurs
          </Link>
        </p>
      </section>

      <div className="mt-8">
        <Link href={`/${locale}/biens`} className="text-deep-green hover:underline">
          ← Parcourir le catalogue agrégé
        </Link>
      </div>
    </div>
  );
}
