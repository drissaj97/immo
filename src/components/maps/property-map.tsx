"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { coordinateSourceLabel, type MapListingPoint } from "@/lib/map/listing-map-points";
import type { MapPoiPoint } from "@/lib/map/map-poi-types";
import { getMapStyle, MAP_ATTRIBUTION } from "@/lib/map/map-style";

type PoiPayload = MapPoiPoint;

function formatPriceShort(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")} M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)} k`;
  return String(price);
}

export function PropertyMap({
  points,
  center,
  zoom = 13,
  nearbyPoisByKey = {},
  nearbyPois = [],
  locale = "fr",
  neighborhoodLabel,
}: {
  points: MapListingPoint[];
  center?: [number, number];
  zoom?: number;
  nearbyPoisByKey?: Record<string, PoiPayload[]>;
  nearbyPois?: MapPoiPoint[];
  locale?: string;
  neighborhoodLabel?: string;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const initialCenter = center ?? computeCenter(points) ?? ([-7.62, 33.57] as [number, number]);
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: getMapStyle(),
      center: initialCenter,
      zoom: points.length ? Math.max(zoom, 12) : 6,
      maxZoom: 18,
      minZoom: 5,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-right");
    map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: MAP_ATTRIBUTION }),
      "bottom-left",
    );

    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init carte une seule fois
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    for (const poi of nearbyPois) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "map-poi-marker";
      el.title = `${poi.category} · ${poi.name}`;
      el.innerHTML = `<span>${poiIcon(poi.category)}</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([poi.longitude, poi.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 10, maxWidth: "240px", className: "map-popup" }).setHTML(
            `<div class="map-popup-body">
              <div class="map-popup-category">${escapeHtml(poi.category)}</div>
              <strong>${escapeHtml(poi.name)}</strong>
              <div class="map-popup-meta">${poi.distanceM} m du quartier</div>
            </div>`,
          ),
        )
        .addTo(map);

      markersRef.current.push(marker);
    }

    for (const point of points) {
      const isExact = point.coordinateSource === "exact";
      const isSelected = selectedId === point.id;
      const poiKey = `${point.mapLatitude.toFixed(3)}|${point.mapLongitude.toFixed(3)}`;
      const pois = nearbyPoisByKey[poiKey] ?? [];

      const el = document.createElement("button");
      el.type = "button";
      el.className = `map-listing-marker ${isExact ? "map-listing-marker--exact" : "map-listing-marker--approx"}${isSelected ? " map-listing-marker--active" : ""}`;
      el.innerHTML = `<span>${formatPriceShort(point.price)}</span>`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedId(point.id);
      });

      const popup = new maplibregl.Popup({
        offset: 16,
        maxWidth: "300px",
        className: "map-popup",
        closeOnClick: true,
      }).setHTML(buildListingPopupHtml(point, pois, locale));

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([point.mapLongitude, point.mapLatitude])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        popup.addTo(map);
        map.flyTo({ center: [point.mapLongitude, point.mapLatitude], zoom: Math.max(map.getZoom(), 14) });
      });

      markersRef.current.push(marker);
    }

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.mapLongitude, p.mapLatitude]));
      nearbyPois.forEach((p) => bounds.extend([p.longitude, p.latitude]));
      map.fitBounds(bounds, { padding: 64, maxZoom: 15, duration: 800 });
    } else if (points.length === 1) {
      map.flyTo({
        center: [points[0].mapLongitude, points[0].mapLatitude],
        zoom: Math.max(zoom, 14),
        duration: 800,
      });
    }
  }, [points, nearbyPoisByKey, nearbyPois, ready, locale, selectedId, zoom]);

  return (
    <div className="relative h-full min-h-[400px] w-full">
      <div ref={mapContainer} className="h-full w-full rounded-lg" />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-sand/40">
          <p className="rounded-lg bg-ivory/95 px-4 py-2 text-sm text-charcoal/70 shadow">
            Chargement de la carte…
          </p>
        </div>
      )}

      {ready && points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-charcoal/5">
          <p className="rounded-lg bg-ivory/95 px-4 py-2 text-sm text-charcoal/70 shadow">
            Aucun bien géolocalisable pour cette recherche
          </p>
        </div>
      )}

      {ready && (neighborhoodLabel || points.length > 0) && (
        <div className="pointer-events-none absolute left-3 top-3 max-w-xs rounded-lg bg-ivory/95 px-3 py-2 shadow-md">
          {neighborhoodLabel && (
            <p className="text-sm font-medium text-charcoal">{neighborhoodLabel}</p>
          )}
          <p className="text-xs text-charcoal/60">
            {points.length} annonce{points.length > 1 ? "s" : ""}
            {nearbyPois.length > 0 && ` · ${nearbyPois.length} commerces à proximité`}
          </p>
        </div>
      )}

      {ready && points.some((p) => p.coordinateSource !== "exact") && (
        <div className="pointer-events-none absolute bottom-10 left-3 rounded-lg bg-ivory/95 px-2.5 py-1.5 text-[10px] text-charcoal/70 shadow">
          <span className="inline-block h-2 w-2 rounded-full bg-deep-green align-middle" /> position exacte
          {" · "}
          <span className="inline-block h-2 w-2 rounded-full bg-bronze align-middle" /> centre du quartier
        </div>
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

function poiIcon(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("super") || c.includes("épicerie") || c.includes("commercial")) return "🛒";
  if (c.includes("pharmacie")) return "💊";
  if (c.includes("école")) return "🏫";
  if (c.includes("mosquée")) return "🕌";
  if (c.includes("restaurant") || c.includes("café")) return "☕";
  if (c.includes("banque")) return "🏦";
  if (c.includes("hôpital")) return "🏥";
  return "📍";
}

function buildListingPopupHtml(point: MapListingPoint, pois: PoiPayload[], locale: string): string {
  const locLabel = coordinateSourceLabel(point.coordinateSource);
  const listingUrl = `/${locale}/biens/${point.slug}`;

  let html = `<div class="map-popup-body">
    <div class="map-popup-category">${escapeHtml(point.neighborhood)} · ${escapeHtml(point.city)}</div>
    <strong>${escapeHtml(truncate(point.title, 72))}</strong>
    <div class="map-popup-price">${point.price.toLocaleString("fr-MA")} ${point.currency}</div>
    <div class="map-popup-meta">${escapeHtml(locLabel)}</div>`;

  if (pois.length > 0) {
    html += `<div style="margin-top:10px;border-top:1px solid #eee;padding-top:8px">
      <div style="font-size:10px;font-weight:600;color:#666;margin-bottom:4px">Commerces & services à proximité</div>
      <ul style="margin:0;padding-left:14px;font-size:11px;color:#555">`;
    for (const poi of pois.slice(0, 5)) {
      html += `<li>${escapeHtml(poi.category)} · ${escapeHtml(poi.name)} (${poi.distanceM} m)</li>`;
    }
    html += `</ul></div>`;
  }

  html += `<a class="map-popup-link" href="${listingUrl}">Voir l'annonce →</a></div>`;
  return html;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
