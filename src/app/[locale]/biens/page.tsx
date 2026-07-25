import { ListingCard } from "@/components/listings/listing-card";
import { PropertyMap } from "@/components/maps/property-map";
import { searchListings } from "@/server/repositories/listings";
import { getAggregationStats } from "@/lib/aggregation/sync";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { buildMetadata } from "@/lib/seo/metadata";
import { ListingFilters } from "@/components/listings/listing-filters";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Biens immobiliers",
    description: "Parcourez les annonces immobilières réelles (Holding IMMO) et agrégées au Maroc.",
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
    includeDemo: sp.demo === "1" || sp.includeDemo === "true" ? true : undefined,
    sort: (sp.sort as SearchFilters["sort"]) ?? "recent",
    page: sp.page ? Number(sp.page) : 1,
  };

  const { items, total } = await searchListings(filters);
  const aggStats = await getAggregationStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Biens immobiliers</h1>
        <p className="mt-2 text-charcoal/60">
          {total} résultat{total > 1 ? "s" : ""} · {aggStats.published} annonces agrégées
          {" · "}
          <Link href={`/${locale}/agregateur`} className="text-deep-green hover:underline">
            Sources ({Object.keys(aggStats.bySource).length})
          </Link>
          {!filters.includeDemo && (
            <>
              {" · "}
              <Link href={`/${locale}/biens?demo=1`} className="text-charcoal/50 hover:text-deep-green">
                Afficher données démo
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <ListingFilters locale={locale} current={filters} />
        <div>
          <div className="mb-6 h-64 overflow-hidden rounded-lg border border-charcoal/10 lg:hidden">
            <PropertyMap listings={items} />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} locale={locale} />
            ))}
          </div>
          {items.length === 0 && (
            <p className="py-12 text-center text-charcoal/60">Aucun bien ne correspond à vos critères.</p>
          )}
        </div>
      </div>
    </div>
  );
}
