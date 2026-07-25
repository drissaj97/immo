import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo/metadata";
import { getNeighborhoodContextBySlug } from "@/modules/ai/rag";
import { searchListings } from "@/server/repositories/listings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ville: string; quartier: string }>;
}) {
  const { locale, ville, quartier } = await params;
  const slug = `${decodeURIComponent(ville)}/${decodeURIComponent(quartier)}`.toLowerCase();
  const knowledge = getNeighborhoodContextBySlug(slug);
  if (!knowledge) return {};
  return buildMetadata({
    title: `Immobilier ${knowledge.neighborhood}, ${knowledge.city}`,
    description: knowledge.summary,
    path: `/villes/${ville}/${quartier}`,
    locale,
  });
}

export default async function QuartierPage({
  params,
}: {
  params: Promise<{ locale: string; ville: string; quartier: string }>;
}) {
  const { locale, ville, quartier } = await params;
  const slug = `${decodeURIComponent(ville)}/${decodeURIComponent(quartier)}`.toLowerCase();
  const knowledge = getNeighborhoodContextBySlug(slug);
  if (!knowledge) notFound();

  const { items, total } = await searchListings({
    city: knowledge.city,
    neighborhood: knowledge.neighborhood,
    limit: 6,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <Link href={`/${locale}/villes/${ville}`} className="text-sm text-deep-green hover:underline">
        ← {knowledge.city}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl">{knowledge.neighborhood}</h1>
        <Badge>{knowledge.region}</Badge>
        {knowledge.tags.map((tag) => (
          <Badge key={tag} variant="default">
            {tag}
          </Badge>
        ))}
      </div>

      <p className="mt-4 max-w-3xl text-lg text-charcoal/80">{knowledge.summary}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-serif text-xl">Points clés</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-charcoal/70">
            {knowledge.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-serif text-xl">Notes investissement</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-charcoal/70">
            {knowledge.investmentNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      </div>

      {(knowledge.avgPricePerSqm || knowledge.avgYield) && (
        <div className="mt-8 flex flex-wrap gap-6 rounded-lg border border-charcoal/10 p-6">
          {knowledge.avgPricePerSqm && (
            <div>
              <p className="text-sm text-charcoal/60">Prix moyen indicatif</p>
              <p className="text-xl font-medium text-deep-green">
                {knowledge.avgPricePerSqm.toLocaleString("fr-MA")} MAD/m²
              </p>
            </div>
          )}
          {knowledge.avgYield && (
            <div>
              <p className="text-sm text-charcoal/60">Rendement moyen indicatif</p>
              <p className="text-xl font-medium text-deep-green">{knowledge.avgYield}%</p>
            </div>
          )}
          <p className="w-full text-xs text-charcoal/40">
            Données calculées sur le catalogue agrégé DarBladi
            {knowledge.listingCount ? ` · ${knowledge.listingCount} annonces` : ""}
          </p>
        </div>
      )}

      <section className="mt-12">
        <h2 className="font-serif text-xl">{total} bien(s) dans ce quartier</h2>
        {items.length === 0 ? (
          <p className="mt-4 text-charcoal/60">Aucune annonce publiée pour le moment.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((l) => (
              <li key={l.id}>
                <Link href={`/${locale}/biens/${l.slug}`} className="text-deep-green hover:underline">
                  {l.title} — {l.price.toLocaleString("fr-MA")} {l.currency}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/${locale}/biens?city=${encodeURIComponent(knowledge.city)}&neighborhood=${encodeURIComponent(knowledge.neighborhood)}`}
          className="mt-4 inline-block text-sm text-deep-green hover:underline"
        >
          Voir toutes les annonces →
        </Link>
      </section>
    </div>
  );
}
