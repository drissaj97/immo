import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getNeighborhoodsByCity } from "@/lib/data/neighborhood-knowledge";
import { getCities } from "@/server/repositories/listings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ville: string }>;
}) {
  const { locale, ville } = await params;
  return buildMetadata({
    title: `Immobilier à ${decodeURIComponent(ville)}`,
    description: `Annonces et analyses à ${decodeURIComponent(ville)}.`,
    path: `/villes/${ville}`,
    locale,
  });
}

export default async function VillePage({
  params,
}: {
  params: Promise<{ locale: string; ville: string }>;
}) {
  const { locale, ville } = await params;
  const cityName = decodeURIComponent(ville);
  const cities = await getCities();
  const count = cities.find((c) => c.city.toLowerCase() === cityName.toLowerCase())?.count ?? 0;
  const neighborhoods = getNeighborhoodsByCity(cityName);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Immobilier à {cityName}</h1>
      <p className="mt-2 text-charcoal/60">{count} annonces indexées</p>
      <Link href={`/${locale}/biens?city=${encodeURIComponent(cityName)}`} className="mt-6 inline-block text-deep-green hover:underline">
        Voir les annonces →
      </Link>

      {neighborhoods.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-xl">Quartiers</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {neighborhoods.map((n) => {
              const [villeSlug, quartierSlug] = n.slug.split("/");
              return (
                <Link
                  key={n.slug}
                  href={`/${locale}/villes/${villeSlug}/${quartierSlug}`}
                  className="rounded-lg border border-charcoal/10 p-5 hover:border-deep-green/30"
                >
                  <h3 className="font-medium">{n.neighborhood}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-charcoal/70">{n.summary}</p>
                  {n.avgYield && (
                    <p className="mt-3 text-xs text-deep-green">Rendement indicatif ~{n.avgYield}%</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
