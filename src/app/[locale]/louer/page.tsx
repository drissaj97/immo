import { ListingCard } from "@/components/listings/listing-card";
import { searchListings } from "@/server/repositories/listings";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Louer un bien", description: "Locations longue durée et saisonnières.", path: "/louer", locale });
}

export default async function LouerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const longTerm = await searchListings({ transactionType: "long_term_rent", limit: 12 });
  const seasonal = await searchListings({ transactionType: "seasonal_rent", limit: 12 });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Louer</h1>
      <h2 className="mt-8 font-serif text-xl">Longue durée</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {longTerm.items.map((l) => <ListingCard key={l.id} listing={l} locale={locale} />)}
      </div>
      <h2 className="mt-12 font-serif text-xl">Saisonnier</h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {seasonal.items.map((l) => <ListingCard key={l.id} listing={l} locale={locale} />)}
      </div>
    </div>
  );
}
