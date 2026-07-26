import Link from "next/link";
import { ListingsFeed } from "@/components/listings/listings-feed";
import { ListingCard } from "@/components/listings/listing-card";
import { PropertyMapLazy } from "@/components/maps/property-map-lazy";
import { getFeaturedListings, searchListings } from "@/server/repositories/listings";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { buildMetadata } from "@/lib/seo/metadata";
import { PropertySearch } from "@/components/search/property-search";
import { PopularSearchLinks } from "@/components/search/popular-search-links";
import { getGeographySearchTree } from "@/lib/geography/index";
import { prepareMapPageData } from "@/lib/map/prepare-map-page";
import { hasCompleteLocation, locationGateMessage } from "@/lib/search/location-gate";
import { parseListingSearchParams } from "@/lib/search/parse-search-params";
import { LISTINGS_PAGE_SIZE } from "@/lib/search/page-size";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Biens immobiliers",
    description: "Parcourez toutes les annonces immobilières au Maroc — vente et location.",
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
  const geography = getGeographySearchTree();
  // Source originale (Mubawab / Avito…) — pas de marque Semsar AI
  const revealSources = true;

  // Toujours un type de transaction (défaut vente) — évite le mélange Louer/À vendre.
  const baseFilters: SearchFilters = parseListingSearchParams(sp, {
    transactionType: "sale",
  });

  const hasLocation = hasCompleteLocation(baseFilters);

  // Une seule recherche (10) pour éviter double scan / saturation mémoire
  const searchResult = hasLocation
    ? await searchListings({ ...baseFilters, page: 1, limit: LISTINGS_PAGE_SIZE })
    : { items: [], total: 0, totalPages: 1, totalAvailable: 0, page: 1 };

  const { items, total, totalPages } = searchResult;
  const featured = hasLocation ? [] : await getFeaturedListings(6);
  const mapData =
    hasLocation && items.length > 0
      ? await prepareMapPageData(items, {
          searchCity: baseFilters.city,
          searchNeighborhood: baseFilters.neighborhood,
        })
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl">Biens immobiliers au Maroc</h1>
        <p className="mt-2 text-charcoal/60">
          {hasLocation ? (
            <>
              {total.toLocaleString("fr-MA")} résultat{total > 1 ? "s" : ""}
              {filtersLabel(baseFilters)}
              {" · "}
              {LISTINGS_PAGE_SIZE} par page
            </>
          ) : (
            <>Sélectionnez une région, une ville et un quartier pour afficher les annonces</>
          )}
        </p>
      </div>

      <div className="mb-8">
        <PropertySearch
          locale={locale}
          variant="compact"
          geography={geography}
          requireLocation
          defaultTransaction={baseFilters.transactionType === "long_term_rent" ? "long_term_rent" : "sale"}
          initial={{
            transactionType: baseFilters.transactionType === "long_term_rent" ? "long_term_rent" : "sale",
            region: baseFilters.region ?? "",
            city: baseFilters.city ?? "",
            neighborhood: baseFilters.neighborhood ?? "",
            listingType: baseFilters.listingType ?? "",
            minPrice: baseFilters.minPrice ? String(baseFilters.minPrice) : "",
            maxPrice: baseFilters.maxPrice ? String(baseFilters.maxPrice) : "",
          }}
        />
      </div>

      {mapData && mapData.mapCount > 0 && (
        <div className="mb-8 h-72 overflow-hidden rounded-lg border border-charcoal/10 lg:h-96">
          <PropertyMapLazy
            points={mapData.points}
            nearbyPoisByKey={mapData.nearbyPoisByKey}
            nearbyPois={mapData.nearbyPois}
            center={mapData.mapCenter}
            zoom={14}
            locale={locale}
            neighborhoodLabel={
              baseFilters.neighborhood && baseFilters.city
                ? `${baseFilters.neighborhood}, ${baseFilters.city}`
                : undefined
            }
          />
        </div>
      )}

      {hasLocation ? (
        items.length > 0 ? (
          <ListingsFeed
            locale={locale}
            initialItems={items}
            total={total}
            totalPages={totalPages}
            revealSources={revealSources}
            query={{
              region: baseFilters.region,
              city: baseFilters.city,
              neighborhood: baseFilters.neighborhood,
              transactionType: baseFilters.transactionType,
              listingType: baseFilters.listingType,
              minPrice: baseFilters.minPrice ? String(baseFilters.minPrice) : undefined,
              maxPrice: baseFilters.maxPrice ? String(baseFilters.maxPrice) : undefined,
              bedrooms: baseFilters.bedrooms ? String(baseFilters.bedrooms) : undefined,
              sort: baseFilters.sort,
            }}
          />
        ) : (
          <p className="py-12 text-center text-charcoal/60">
            Aucun bien ne correspond à vos critères.
            {baseFilters.neighborhood && baseFilters.transactionType === "sale" && (
              <> Essayez l&apos;onglet <strong>Louer</strong> — certains quartiers ont surtout des locations.</>
            )}
          </p>
        )
      ) : (
        <div className="space-y-10">
          <div className="rounded-xl border border-dashed border-charcoal/20 bg-sand/20 px-4 py-10 text-center">
            <p className="text-charcoal/70">{locationGateMessage()}</p>
            <PopularSearchLinks locale={locale} path="biens" className="mt-5" />
          </div>
          {featured.length > 0 && (
            <div>
              <h2 className="mb-4 font-serif text-2xl">Annonces en avant</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} locale={locale} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function filtersLabel(filters: SearchFilters): string {
  const parts = [filters.region, filters.city, filters.neighborhood].filter(Boolean);
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}
