import { ListingCard } from "@/components/listings/listing-card";
import { PropertySearch } from "@/components/search/property-search";
import { searchListings } from "@/server/repositories/listings";
import { getGeographySearchTree } from "@/lib/geography/index";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Louer un bien",
    description: "Locations longue durée et saisonnières.",
    path: "/louer",
    locale,
  });
}

export default async function LouerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const geography = getGeographySearchTree();

  const filters: SearchFilters = {
    transactionType: "long_term_rent",
    region: sp.region as string | undefined,
    city: sp.city as string | undefined,
    neighborhood: sp.neighborhood as string | undefined,
    listingType: (sp.listingType as SearchFilters["listingType"]) ?? undefined,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    limit: 24,
  };

  const hasLocation = Boolean(filters.region && filters.city);
  const { items } = hasLocation ? await searchListings(filters) : { items: [] };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Louer un bien immobilier</h1>
      <p className="mt-2 text-charcoal/60">
        Filtrez par région, ville et quartier pour une recherche location rapide.
      </p>

      <div className="mt-8">
        <PropertySearch
          locale={locale}
          variant="compact"
          geography={geography}
          requireLocation
          searchPath={`/${locale}/louer`}
          defaultTransaction="long_term_rent"
          initial={{
            transactionType: "long_term_rent",
            region: filters.region ?? "",
            city: filters.city ?? "",
            neighborhood: filters.neighborhood ?? "",
            listingType: filters.listingType ?? "",
            minPrice: filters.minPrice ? String(filters.minPrice) : "",
            maxPrice: filters.maxPrice ? String(filters.maxPrice) : "",
          }}
        />
      </div>

      {hasLocation ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="mt-12 text-center text-charcoal/60">
          Exemple : Rabat-Salé-Kénitra → Salé → Bouknadel
        </p>
      )}

      {hasLocation && items.length === 0 && (
        <p className="mt-12 text-center text-charcoal/60">Aucune annonce de location pour ces critères.</p>
      )}
    </div>
  );
}
