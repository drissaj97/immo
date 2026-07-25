import { ListingCard } from "@/components/listings/listing-card";
import { ListingPagination } from "@/components/listings/listing-pagination";
import { PropertyMap } from "@/components/maps/property-map";
import { searchListings } from "@/server/repositories/listings";
import { getSemsaraiTotalCount } from "@/lib/semsarai/live-search";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { buildMetadata } from "@/lib/seo/metadata";
import { PropertySearch } from "@/components/search/property-search";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Biens immobiliers",
    description: "Parcourez toutes les annonces immobilières agrégées au Maroc — vente et location.",
    path: "/biens",
    locale,
  });
}

export default async function BiensPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;

  const filters: SearchFilters = {
    transactionType: (sp.transactionType as SearchFilters["transactionType"]) ?? undefined,
    listingType: (sp.listingType as SearchFilters["listingType"]) ?? undefined,
    city: sp.city as string | undefined,
    neighborhood: sp.neighborhood as string | undefined,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    bedrooms: sp.bedrooms ? Number(sp.bedrooms) : undefined,
    hasPool: sp.hasPool === "true" ? true : undefined,
    isVerified: sp.isVerified === "true" ? true : undefined,
    source: sp.source as SearchFilters["source"],
    sort: (sp.sort as SearchFilters["sort"]) ?? "recent",
    page: sp.page ? Number(sp.page) : 1,
    limit: 48,
  };

  const [{ items, total, totalPages, totalAvailable }, apiTotal] = await Promise.all([
    searchListings(filters),
    getSemsaraiTotalCount().catch(() => null),
  ]);

  const catalogTotal = apiTotal ?? totalAvailable ?? total;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Biens immobiliers au Maroc</h1>
        <p className="mt-2 text-charcoal/60">
          {total.toLocaleString("fr-MA")} résultat{total > 1 ? "s" : ""}
          {catalogTotal > total ? ` · ${catalogTotal.toLocaleString("fr-MA")} annonces indexées` : ""}
          {" · "}
          <Link href={`/${locale}/agregateur`} className="text-deep-green hover:underline">
            Sources agrégées
          </Link>
        </p>
      </div>

      <div className="mb-8">
        <PropertySearch
          locale={locale}
          variant="compact"
          defaultTransaction={filters.transactionType === "long_term_rent" ? "long_term_rent" : "sale"}
          initial={{
            transactionType: filters.transactionType === "long_term_rent" ? "long_term_rent" : "sale",
            city: filters.city ?? "",
            listingType: filters.listingType ?? "",
            minPrice: filters.minPrice ? String(filters.minPrice) : "",
            maxPrice: filters.maxPrice ? String(filters.maxPrice) : "",
          }}
        />
      </div>

      <div className="mb-6 h-64 overflow-hidden rounded-lg border border-charcoal/10 lg:hidden">
        <PropertyMap listings={items} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((listing) => (
          <ListingCard key={listing.id} listing={listing} locale={locale} />
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-12 text-center text-charcoal/60">
          Aucun bien ne correspond à vos critères. Essayez d&apos;élargir la recherche.
        </p>
      )}

      <ListingPagination
        locale={locale}
        page={filters.page ?? 1}
        totalPages={totalPages}
        searchParams={sp}
      />
    </div>
  );
}
