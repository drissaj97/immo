"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ListingWithLocation } from "@/server/repositories/listings";

export function PropertyMap({
  listings,
  center = [-6.8, 33.5] as [number, number],
  zoom = 5,
}: {
  listings: ListingWithLocation[];
  center?: [number, number];
  zoom?: number;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://demotiles.maplibre.org/style.json",
      center,
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    listings.forEach((listing) => {
      const el = document.createElement("div");
      el.className = "rounded-full bg-deep-green w-3 h-3 border-2 border-ivory shadow";
      new maplibregl.Marker(el)
        .setLngLat([listing.longitude, listing.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(
            `<strong>${listing.title}</strong><br/>${listing.price.toLocaleString("fr-MA")} ${listing.currency}`,
          ),
        )
        .addTo(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [listings, center, zoom]);

  return <div ref={mapContainer} className="h-full min-h-[400px] w-full rounded-lg" />;
}
