import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listFavoriteListings } from "@/server/repositories/favorites";
import { ListingCard } from "@/components/listings/listing-card";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Favoris", description: "Vos biens favoris.", path: "/dashboard/favoris", locale });
}

export default async function FavorisPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getSession();
  if (!user) redirect(`/${locale}/connexion`);

  const favorites = await listFavoriteListings(user.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Favoris</h1>
      <Link href={`/${locale}/dashboard`} className="mt-2 inline-block text-sm text-deep-green hover:underline">
        ← Dashboard
      </Link>
      {favorites.length === 0 ? (
        <p className="mt-4 text-charcoal/60">
          Aucun favori.{" "}
          <Link href={`/${locale}/biens`} className="text-deep-green">
            Parcourir les biens
          </Link>
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((l) => (
            <ListingCard key={l.id} listing={l} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
