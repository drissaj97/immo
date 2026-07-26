import { PropertyMapLazy } from "@/components/maps/property-map-lazy";
import { PropertySearch } from "@/components/search/property-search";
import { PopularSearchLinks } from "@/components/search/popular-search-links";
import { searchListings } from "@/server/repositories/listings";
import { getGeographySearchTree } from "@/lib/geography/index";
import { hasCompleteLocation, locationGateMessage } from "@/lib/search/location-gate";
import { prepareMapPageData } from "@/lib/map/prepare-map-page";
import { MAP_PAGE_SIZE } from "@/lib/search/page-size";
import { defaultCatalogHref } from "@/lib/search/popular-searches";
import type { SearchFilters } from "@/modules/search/natural-language-parser";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildMetadata({
    title: "Carte des biens",
    description: "Visualisez les annonces immobilières sur la carte — position exacte ou quartier.",
    path: "/carte",
    locale,
  });
}

export default async function CartePage({
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
    transactionType: (sp.transactionType as SearchFilters["transactionType"]) ?? undefined,
    region: sp.region as string | undefined,
    city: sp.city as string | undefined,
    neighborhood: sp.neighborhood as string | undefined,
    listingType: (sp.listingType as SearchFilters["listingType"]) ?? undefined,
    limit: MAP_PAGE_SIZE,
  };

  const hasLocation = hasCompleteLocation(filters);
  const { items } = hasLocation ? await searchListings(filters) : { items: [] };
  const mapData = hasLocation
    ? await prepareMapPageData(items)
    : { points: [], nearbyPoisByKey: {}, nearbyPois: [], mapCount: 0, listings: [] };

  const neighborhoodLabel =
    filters.neighborhood && filters.city
      ? `${filters.neighborhood}, ${filters.city}`
      : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <h1 className="font-serif text-3xl">Carte des biens</h1>
      <p className="mt-2 text-charcoal/60">
        {hasLocation ? (
          <>
            {mapData.mapCount} bien{mapData.mapCount > 1 ? "s" : ""} sur la carte
            {filters.neighborhood && ` · ${filters.neighborhood}, ${filters.city}`}
          </>
        ) : (
          locationGateMessage()
        )}
      </p>

      <div className="mt-6 mb-6">
        <PropertySearch
          locale={locale}
          variant="compact"
          geography={geography}
          requireLocation
          searchPath={`/${locale}/carte`}
          initial={{
            region: filters.region ?? "",
            city: filters.city ?? "",
            neighborhood: filters.neighborhood ?? "",
            listingType: filters.listingType ?? "",
          }}
        />
      </div>

      <div className="h-[70vh] overflow-hidden rounded-lg border border-charcoal/10">
        <PropertyMapLazy
          points={mapData.points}
          nearbyPoisByKey={mapData.nearbyPoisByKey}
          nearbyPois={mapData.nearbyPois}
          locale={locale}
          neighborhoodLabel={neighborhoodLabel}
        />
      </div>

      {!hasLocation && (
        <div className="mt-6 space-y-3 text-center">
          <p className="text-sm text-charcoal/60">{locationGateMessage()}</p>
          <PopularSearchLinks locale={locale} path="carte" />
          <p className="text-sm text-charcoal/50">
            Ou ouvrir le{" "}
            <Link href={defaultCatalogHref(locale, "carte")} className="text-deep-green hover:underline">
              quartier Victoria (Bouskoura)
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
