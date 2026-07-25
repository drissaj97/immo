import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { getRegions } from "@/server/repositories/listings";
import { getGeographyIndex } from "@/lib/geography/index";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Toutes les régions immobilières au Maroc",
    description: "Les 12 régions du Maroc — annonces immobilières vente et location sur DarBladi.",
    path: "/regions",
    locale,
  });
}

export default async function RegionsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const regions = await getRegions();
  const index = getGeographyIndex();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl md:text-4xl">Toutes les régions du Maroc</h1>
      <p className="mt-3 max-w-2xl text-charcoal/70">
        {regions.length} régions · couverture nationale DarBladi
        {index
          ? ` · ${index.apiTotalCount.toLocaleString("fr-MA")} annonces disponibles`
          : ""}
      </p>

      <Link
        href={`/${locale}/villes`}
        className="mt-6 inline-block text-sm text-deep-green hover:underline"
      >
        ← Voir toutes les villes
      </Link>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {regions.map(({ region, count, slug, cities }) => (
          <Link
            key={slug}
            href={`/${locale}/regions/${slug}`}
            className="rounded-xl border border-charcoal/10 bg-ivory p-6 transition hover:border-deep-green/30"
          >
            <h2 className="font-serif text-xl">{region}</h2>
            <p className="mt-2 text-sm text-charcoal/60">
              {count.toLocaleString("fr-MA")} annonces · {cities.length} ville
              {cities.length > 1 ? "s" : ""}
            </p>
            <p className="mt-3 line-clamp-2 text-xs text-charcoal/50">
              {cities.slice(0, 8).join(", ")}
              {cities.length > 8 ? "…" : ""}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
