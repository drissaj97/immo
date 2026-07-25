"use client";

import dynamic from "next/dynamic";
import type { MapListingPoint } from "@/lib/map/listing-map-points";

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

type PoiPayload = { name: string; category: string; distanceM: number };

export function PropertyMapLazy({
  points,
  nearbyPoisByKey = {},
  center,
  zoom,
}: {
  points: MapListingPoint[];
  nearbyPoisByKey?: Record<string, PoiPayload[]>;
  center?: [number, number];
  zoom?: number;
}) {
  return (
    <PropertyMap points={points} nearbyPoisByKey={nearbyPoisByKey} center={center} zoom={zoom} />
  );
}
