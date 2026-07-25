import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCityIndex } from "@/server/repositories/listings";
import { getNeighborhoodsByCity } from "@/lib/data/neighborhood-knowledge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; ville: string }>;
}) {
  const { locale, ville } = await params;
  const cityName = decodeURIComponent(ville).replace(/-/g, " ");
  const cityIndex = await getCityIndex(cityName);
  const displayName = cityIndex?.name ?? cityName;
  return buildMetadata({
    title: `Immobilier à ${displayName}`,
    description: `Annonces et analyses à ${displayName}.`,
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
  const slug = decodeURIComponent(ville);
  const cityIndex = await getCityIndex(slug.replace(/-/g, " ")) ?? (await getCityIndex(slug));
  const cityName = cityIndex?.name ?? slug.replace(/-/g, " ");
  const count = cityIndex?.count ?? 0;
  const geoNeighborhoods = cityIndex?.neighborhoods ?? [];
  const knowledgeNeighborhoods = getNeighborhoodsByCity(cityName);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <Link href={`/${locale}/villes`} className="text-sm text-deep-green hover:underline">
        ← Toutes les villes
      </Link>
      <h1 className="mt-4 font-serif text-3xl">Immobilier à {cityName}</h1>
      {cityIndex?.region && (
        <p className="mt-1 text-sm text-charcoal/50">
          Région :{" "}
          <Link href={`/${locale}/regions/${cityIndex.regionSlug}`} className="text-deep-green hover:underline">
            {cityIndex.region}
          </Link>
        </p>
      )}
      <p className="mt-2 text-charcoal/60">{count.toLocaleString("fr-MA")} annonces indexées</p>
      <p className="mt-6 text-sm text-charcoal/60">
        Choisissez un quartier ci-dessous pour lancer une recherche ciblée.
      </p>

      {geoNeighborhoods.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-xl">Quartiers ({geoNeighborhoods.length})</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {geoNeighborhoods.map((n) => (
              <Link
                key={n.slug}
                href={`/${locale}/villes/${cityIndex?.slug ?? ville}/${n.slug}`}
                className="rounded-lg border border-charcoal/10 p-5 hover:border-deep-green/30"
              >
                <h3 className="font-medium">{n.name}</h3>
                <p className="mt-1 text-sm text-charcoal/60">
                  {n.count.toLocaleString("fr-MA")} annonce{n.count > 1 ? "s" : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {knowledgeNeighborhoods.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-xl">Guides quartiers</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {knowledgeNeighborhoods.map((n) => {
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
