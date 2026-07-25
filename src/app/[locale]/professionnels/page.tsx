import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo/metadata";
import { getAgencies } from "@/lib/data/marketplace-data";
import { getAggregationStats } from "@/lib/aggregation/sync";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Professionnels immobiliers",
    description: "Agences et partenaires indexés sur DarBladi — annonces réelles au Maroc.",
    path: "/professionnels",
    locale,
  });
}

export default async function ProfessionnelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const agencies = getAgencies();
  const stats = await getAggregationStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Professionnels immobiliers</h1>
      <p className="mt-2 max-w-2xl text-charcoal/70">
        Partenaires et sources agrégées sur DarBladi — {stats.published.toLocaleString("fr-MA")} annonces
        réelles indexées au Maroc.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-xl">Sources partenaires</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agencies.map((org) => (
            <Link
              key={org.id}
              href={`/${locale}/professionnels/${org.slug}`}
              className="rounded-lg border border-charcoal/10 p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-serif text-lg">{org.name}</h3>
                {org.isVerified && <Badge variant="verified">Vérifié</Badge>}
              </div>
              <p className="mt-2 text-sm text-charcoal/60">{org.city}</p>
              <p className="mt-3 line-clamp-3 text-sm text-charcoal/70">{org.description}</p>
              <p className="mt-4 text-xs text-deep-green">{org.listingCount} annonces indexées</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-charcoal/10 bg-sand/30 p-6">
        <h2 className="font-serif text-xl">Rejoindre l&apos;agrégateur</h2>
        <p className="mt-2 text-sm text-charcoal/70">
          Agences, promoteurs et portails partenaires : publiez votre flux via l&apos;API DarBladi ou un contrat
          partenaire Avito / Mubawab.
        </p>
        <Link href={`/${locale}/developpeurs`} className="mt-4 inline-block text-sm text-deep-green hover:underline">
          Documentation API partenaires →
        </Link>
      </section>
    </div>
  );
}
