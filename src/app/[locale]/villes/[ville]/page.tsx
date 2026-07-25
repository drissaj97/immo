import { buildMetadata } from "@/lib/seo/metadata";
import { getCities } from "@/server/repositories/listings";
import Link from "next/link";

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <h1 className="font-serif text-3xl">Immobilier à {cityName}</h1>
      <p className="mt-2 text-charcoal/60">{count} biens de démonstration</p>
      <Link href={`/${locale}/biens?city=${encodeURIComponent(cityName)}`} className="mt-6 inline-block text-deep-green hover:underline">
        Voir les annonces →
      </Link>
    </div>
  );
}
