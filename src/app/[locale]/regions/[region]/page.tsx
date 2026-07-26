import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCityIndex, getRegionIndex, getRegions } from "@/server/repositories/listings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}) {
  const { locale, region: regionSlug } = await params;
  const region = await getRegionIndex(regionSlug);
  if (!region) {
    return buildMetadata({
      title: "Région introuvable",
      description: "Cette région n'est pas disponible.",
      locale,
    });
  }
  return buildMetadata({
    title: `Immobilier en ${region.name}`,
    description: `Annonces immobilières en ${region.name} — ${region.count.toLocaleString("fr-MA")} biens indexés.`,
    path: `/regions/${regionSlug}`,
    locale,
  });
}

export async function generateStaticParams() {
  const regions = await getRegions();
  return regions.map((r) => ({ region: r.slug }));
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ locale: string; region: string }>;
}) {
  const { locale, region: regionSlug } = await params;
  const region = await getRegionIndex(regionSlug);
  if (!region) notFound();

  const citiesWithCounts = await Promise.all(
    region.cities.map(async (cityName) => {
      const city = await getCityIndex(cityName);
      return { name: cityName, count: city?.count ?? 0, slug: city?.slug ?? cityName.toLowerCase() };
    }),
  );

  citiesWithCounts.sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <Link href={`/${locale}/regions`} className="text-sm text-deep-green hover:underline">
        ← Toutes les régions
      </Link>
      <h1 className="mt-4 font-serif text-3xl">Immobilier en {region.name}</h1>
      <p className="mt-2 text-charcoal/60">
        {region.count.toLocaleString("fr-MA")} annonces · {region.cities.length} villes
      </p>
      <Link
        href={`/${locale}/biens?region=${encodeURIComponent(region.name)}`}
        className="mt-6 inline-block text-deep-green hover:underline"
      >
        Voir toutes les annonces →
      </Link>

      <section className="mt-12">
        <h2 className="font-serif text-xl">Villes de {region.name}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {citiesWithCounts.map(({ name, count, slug }) => (
            <Link
              key={name}
              href={`/${locale}/villes/${slug}`}
              className="rounded-lg border border-charcoal/10 p-5 hover:border-deep-green/30"
            >
              <h3 className="font-medium">{name}</h3>
              <p className="mt-1 text-sm text-charcoal/60">
                {count.toLocaleString("fr-MA")} annonce{count > 1 ? "s" : ""}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
