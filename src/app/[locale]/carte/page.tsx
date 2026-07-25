import { PropertyMap } from "@/components/maps/property-map";
import { searchListings } from "@/server/repositories/listings";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({ title: "Carte des biens", description: "Visualisez les biens sur la carte.", path: "/carte", locale });
}

export default async function CartePage() {
  const { items } = await searchListings({ limit: 50 });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Carte</h1>
      <p className="mt-2 text-charcoal/60">{items.length} biens affichés (démo)</p>
      <div className="mt-6 h-[70vh] overflow-hidden rounded-lg border border-charcoal/10">
        <PropertyMap listings={items} />
      </div>
    </div>
  );
}
