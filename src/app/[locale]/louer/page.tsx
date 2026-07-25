import { ListingsFeed } from "@/components/listings/listings-feed";
import { PropertySearch } from "@/components/search/property-search";
import { PopularSearchLinks } from "@/components/search/popular-search-links";
import { searchListings } from "@/server/repositories/listings";
import { getGeographySearchTree } from "@/lib/geography/index";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { hasCompleteLocation, locationGateMessage } from "@/lib/search/location-gate";
import { LISTINGS_PAGE_SIZE } from "@/lib/search/page-size";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

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
    page: 1,
    limit: LISTINGS_PAGE_SIZE,
  };

  const hasLocation = hasCompleteLocation(filters);
  const { items, total, totalPages } = hasLocation
    ? await searchListings(filters)
    : { items: [], total: 0, totalPages: 1 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Louer un bien immobilier</h1>
      <p className="mt-2 text-charcoal/60">
        {hasLocation
          ? `${total.toLocaleString("fr-MA")} annonces · ${LISTINGS_PAGE_SIZE} par page`
          : "Filtrez par région, ville et quartier pour une recherche location rapide."}
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
        items.length > 0 ? (
          <div className="mt-10">
            <ListingsFeed
              locale={locale}
              initialItems={items}
              total={total}
              totalPages={totalPages}
              columns="sm:grid-cols-2 lg:grid-cols-3"
              query={{
                region: filters.region,
                city: filters.city,
                neighborhood: filters.neighborhood,
                transactionType: "long_term_rent",
                listingType: filters.listingType,
                minPrice: filters.minPrice ? String(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? String(filters.maxPrice) : undefined,
              }}
            />
          </div>
        ) : (
          <p className="mt-12 text-center text-charcoal/60">Aucune annonce de location pour ces critères.</p>
        )
      ) : (
        <div className="mt-12 space-y-4 text-center">
          <p className="text-charcoal/60">{locationGateMessage()}</p>
          <PopularSearchLinks locale={locale} path="louer" />
        </div>
      )}
    </div>
  );
}
