import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCities, getRegions } from "@/server/repositories/listings";
import { slugify } from "@/lib/geography/slug";
import { getGeographyIndex } from "@/lib/geography/index";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Toutes les villes immobilières au Maroc",
    description:
      "Parcourez toutes les villes et régions du Maroc couvertes par DarBladi — annonces vente et location.",
    path: "/villes",
    locale,
  });
}

export default async function VillesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [cities, regions] = await Promise.all([getCities(), getRegions()]);
  const index = getGeographyIndex();

  const citiesByRegion = new Map<string, typeof cities>();
  for (const city of cities) {
    const region = city.region ?? city.city;
    const list = citiesByRegion.get(region) ?? [];
    list.push(city);
    citiesByRegion.set(region, list);
  }

  const sortedRegions = regions.length
    ? regions
    : Array.from(citiesByRegion.entries())
        .map(([region, list]) => ({
          region,
          count: list.reduce((s, c) => s + c.count, 0),
          cities: list.map((c) => c.city),
          slug: region
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        }))
        .sort((a, b) => b.count - a.count);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl md:text-4xl">Toutes les villes au Maroc</h1>
      <p className="mt-3 max-w-2xl text-charcoal/70">
        {cities.length} villes indexées
        {index
          ? ` · ${index.totalListingsScanned.toLocaleString("fr-MA")} annonces analysées sur ${index.apiTotalCount.toLocaleString("fr-MA")} disponibles`
          : ""}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/${locale}/regions`}
          className="rounded-lg border border-deep-green/30 bg-deep-green/5 px-4 py-2 text-sm text-deep-green hover:bg-deep-green/10"
        >
          Voir les {sortedRegions.length} régions →
        </Link>
        <Link
          href={`/${locale}/biens`}
          className="rounded-lg border border-charcoal/15 px-4 py-2 text-sm text-charcoal/70 hover:border-deep-green/30"
        >
          Toutes les annonces
        </Link>
      </div>

      <div className="mt-12 space-y-14">
        {sortedRegions.map(({ region, count, slug, cities: regionCities }) => {
          const regionCityList = citiesByRegion.get(region) ?? [];
          const displayCities =
            regionCityList.length > 0
              ? regionCityList
              : regionCities.map((city) => ({
                  city,
                  count: 0,
                  region,
                }));

          return (
            <section key={slug}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-charcoal/10 pb-4">
                <div>
                  <Link
                    href={`/${locale}/regions/${slug}`}
                    className="font-serif text-2xl text-charcoal hover:text-deep-green"
                  >
                    {region}
                  </Link>
                  <p className="mt-1 text-sm text-charcoal/60">
                    {displayCities.length} ville{displayCities.length > 1 ? "s" : ""} ·{" "}
                    {count.toLocaleString("fr-MA")} annonces
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {displayCities.map(({ city, count: cityCount }) => (
                  <Link
                    key={city}
                    href={`/${locale}/villes/${slugify(city)}`}
                    className="rounded-lg border border-charcoal/10 bg-ivory px-4 py-3 transition hover:border-deep-green/30"
                  >
                    <p className="font-medium">{city}</p>
                    <p className="text-sm text-charcoal/60">
                      {cityCount.toLocaleString("fr-MA")} annonce{cityCount > 1 ? "s" : ""}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
