"use client";

import dynamic from "next/dynamic";
import type { MapListingPoint } from "@/lib/map/listing-map-points";
import type { MapPoiPoint } from "@/lib/map/map-poi-types";

const PropertyMap = dynamic(
  () => import("@/components/maps/property-map").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg bg-sand/30 text-sm text-charcoal/50">
        Chargement de la carte…
      </div>
    ),
  },
);

export function PropertyMapLazy({
  points,
  nearbyPoisByKey = {},
  nearbyPois = [],
  center,
  zoom,
  locale = "fr",
  neighborhoodLabel,
}: {
  points: MapListingPoint[];
  nearbyPoisByKey?: Record<string, MapPoiPoint[]>;
  nearbyPois?: MapPoiPoint[];
  center?: [number, number];
  zoom?: number;
  locale?: string;
  neighborhoodLabel?: string;
}) {
  return (
    <PropertyMap
      points={points}
      nearbyPoisByKey={nearbyPoisByKey}
      nearbyPois={nearbyPois}
      center={center}
      zoom={zoom}
      locale={locale}
      neighborhoodLabel={neighborhoodLabel}
    />
  );
}
