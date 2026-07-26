import Link from "next/link";
import { getAggregationStats } from "@/lib/aggregation/sync";
import { AGGREGATION_SOURCES } from "@/lib/aggregation/sources/registry";
import { buildMetadata } from "@/lib/seo/metadata";
import { Badge } from "@/components/ui/badge";
import { requireAdminPage } from "@/lib/auth/require-admin-page";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Admin — Sources partenaires",
    description: "Tableau de bord privé des sources agrégées (accès admin uniquement).",
    path: "/agregateur",
    locale,
  });
}

const STATUS_LABELS: Record<string, string> = {
  first_party: "First-party",
  partner_contract: "Contrat partenaire",
  licensed_api: "API licenciée",
  scraped: "Scrapé",
  pending: "Partenariat requis",
  disabled: "Désactivé",
};

export default async function AgregateurPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  await requireAdminPage(locale, sp, { nextPath: `/${locale}/agregateur` });

  const stats = await getAggregationStats();
  const key = Array.isArray(sp.key) ? sp.key[0] : sp.key;
  const keyQuery = key ? `?key=${encodeURIComponent(key)}` : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 lg:px-8">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-bronze">Espace admin</p>
      <h1 className="font-serif text-4xl">Sources partenaires</h1>
      <p className="mt-4 text-lg text-charcoal/70">
        Page privée — les visiteurs ne voient pas les marques partenaires sur le site public.
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
        <h2 className="font-serif text-2xl">Détail des sources</h2>
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
                      {STATUS_LABELS[source.licenseStatus] ?? source.licenseStatus}
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
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href={`/${locale}/admin${keyQuery}`} className="text-deep-green hover:underline">
          ← Administration
        </Link>
        <Link
          href={`/${locale}/biens?region=Casablanca-Settat&city=Bouskoura&neighborhood=Victoria&transactionType=sale`}
          className="text-deep-green hover:underline"
        >
          Voir le catalogue public →
        </Link>
      </div>
    </div>
  );
}
