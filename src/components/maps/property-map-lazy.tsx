"use client";

import dynamic from "next/dynamic";
import type { ListingWithLocation } from "@/server/repositories/listings";

const PropertyMap = dynamic(
  () => import("@/components/maps/property-map").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-sand/50" />,
  },
);

export function PropertyMapLazy({ listings }: { listings: ListingWithLocation[] }) {
  return <PropertyMap listings={listings} />;
}
