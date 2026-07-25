"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { coordinateSourceLabel, type MapListingPoint } from "@/lib/map/listing-map-points";

type PoiPayload = {
  name: string;
  category: string;
  distanceM: number;
};

export function PropertyMap({
  points,
  center,
  zoom = 12,
  nearbyPoisByKey = {},
}: {
  points: MapListingPoint[];
  center?: [number, number];
  zoom?: number;
  nearbyPoisByKey?: Record<string, PoiPayload[]>;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapRef.current) {
      const initialCenter = center ?? computeCenter(points) ?? ([-6.8, 33.5] as [number, number]);
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: process.env.NEXT_PUBLIC_MAP_STYLE ?? "https://demotiles.maplibre.org/style.json",
        center: initialCenter,
        zoom: points.length ? Math.max(zoom, 11) : 5,
      });
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      mapRef.current = map;
    }

    const map = mapRef.current;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    for (const point of points) {
      const el = document.createElement("div");
      el.className =
        point.coordinateSource === "exact"
          ? "rounded-full bg-deep-green w-3.5 h-3.5 border-2 border-ivory shadow"
          : "rounded-full bg-bronze w-3.5 h-3.5 border-2 border-ivory shadow";

      const poiKey = `${point.mapLatitude.toFixed(3)}|${point.mapLongitude.toFixed(3)}`;
      const pois = nearbyPoisByKey[poiKey] ?? [];

      const marker = new maplibregl.Marker(el)
        .setLngLat([point.mapLongitude, point.mapLatitude])
        .setPopup(
          new maplibregl.Popup({ offset: 12, maxWidth: "280px" }).setHTML(buildPopupHtml(point, pois)),
        )
        .addTo(map);

      markersRef.current.push(marker);
    }

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.mapLongitude, p.mapLatitude]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
    } else if (points.length === 1) {
      map.flyTo({ center: [points[0].mapLongitude, points[0].mapLatitude], zoom: 14 });
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [points, center, zoom, nearbyPoisByKey]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full min-h-[400px] w-full">
      <div ref={mapContainer} className="h-full w-full rounded-lg" />
      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-charcoal/5">
          <p className="rounded-lg bg-ivory/95 px-4 py-2 text-sm text-charcoal/70 shadow">
            Aucun bien géolocalisable pour cette recherche
          </p>
        </div>
      )}
      {points.some((p) => p.coordinateSource !== "exact") && (
        <p className="absolute bottom-2 left-2 rounded bg-ivory/90 px-2 py-1 text-[10px] text-charcoal/60 shadow">
          ● vert = position annonce · ● bronze = centre du quartier
        </p>
      )}
    </div>
  );
}

function computeCenter(points: MapListingPoint[]): [number, number] | null {
  if (!points.length) return null;
  const lng = points.reduce((sum, p) => sum + p.mapLongitude, 0) / points.length;
  const lat = points.reduce((sum, p) => sum + p.mapLatitude, 0) / points.length;
  return [lng, lat];
}

function buildPopupHtml(point: MapListingPoint, pois: PoiPayload[]): string {
  const locLabel = coordinateSourceLabel(point.coordinateSource);

  let html = `<div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.4">
    <strong>${escapeHtml(point.title)}</strong><br/>
    <span style="color:#555">${point.price.toLocaleString("fr-MA")} ${point.currency}</span><br/>
    <span style="color:#777;font-size:11px">${escapeHtml(point.neighborhood)}, ${escapeHtml(point.city)}</span><br/>
    <span style="color:#888;font-size:10px">${escapeHtml(locLabel)}</span>`;

  if (pois.length > 0) {
    html += `<div style="margin-top:8px;border-top:1px solid #eee;padding-top:6px">
      <div style="font-size:10px;font-weight:600;color:#666;margin-bottom:4px">À proximité</div>
      <ul style="margin:0;padding-left:14px;font-size:10px;color:#555">`;
    for (const poi of pois.slice(0, 4)) {
      html += `<li>${escapeHtml(poi.category)} · ${escapeHtml(poi.name)} (${poi.distanceM} m)</li>`;
    }
    html += `</ul></div>`;
  }

  html += `</div>`;
  return html;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
