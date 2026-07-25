import { ListingCard } from "@/components/listings/listing-card";
import { searchListings } from "@/server/repositories/listings";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Immobilier neuf", description: "Programmes neufs et livraisons.", path: "/neuf", locale });
}

export default async function NeufPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { items } = await searchListings({ isNew: true, limit: 24 });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Neuf</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l) => <ListingCard key={l.id} listing={l} locale={locale} />)}
      </div>
    </div>
  );
}
