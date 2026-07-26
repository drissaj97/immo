"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { coordinateSourceLabel, type MapListingPoint } from "@/lib/map/listing-map-points";
import type { MapPoiPoint } from "@/lib/map/map-poi-types";

type PoiPayload = MapPoiPoint;

const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

function formatPriceShort(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")} M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)} k`;
  return String(price);
}

function priceIcon(price: number, exact: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<button type="button" class="map-listing-marker ${exact ? "map-listing-marker--exact" : "map-listing-marker--approx"}"><span>${formatPriceShort(price)}</span></button>`,
    iconSize: [54, 28],
    iconAnchor: [27, 28],
    popupAnchor: [0, -24],
  });
}

function poiDivIcon(category: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<button type="button" class="map-poi-marker" title="${escapeHtml(category)}"><span>${poiIcon(category)}</span></button>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
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
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Carte « active » : molette / doigt ne bloquent plus le scroll de page tant que false. */
  const [mapEngaged, setMapEngaged] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      const initial = center ?? computeCenter(points) ?? ([-7.62, 33.57] as [number, number]);
      const touch =
        typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0);

      // Leaflet uses [lat, lng]
      // scrollWheelZoom off par défaut → le scroll page n'est pas capturé en passant sur la carte
      const map = L.map(mapContainer.current, {
        center: [initial[1], initial[0]],
        zoom: points.length ? Math.max(zoom, 12) : 6,
        scrollWheelZoom: false,
        dragging: !touch,
        tapHold: false,
      });

      L.tileLayer(OSM_TILES, {
        attribution: OSM_ATTR,
        maxZoom: 19,
      }).addTo(map);

      const engageMap = () => {
        map.scrollWheelZoom.enable();
        if (touch) map.dragging.enable();
        setMapEngaged(true);
      };
      const releaseMap = () => {
        map.scrollWheelZoom.disable();
        if (touch) map.dragging.disable();
        setMapEngaged(false);
      };

      // Clic / focus → activer zoom molette & pan tactile
      map.on("click", engageMap);
      map.on("focus", engageMap);
      map.on("mouseout", releaseMap);
      map.on("blur", releaseMap);

      // Ctrl / ⌘ + molette : zoom sans clic préalable (comportement « Google Maps »)
      const onWheel = (event: WheelEvent) => {
        if (!(event.ctrlKey || event.metaKey)) return;
        if (!map.scrollWheelZoom.enabled()) {
          map.scrollWheelZoom.enable();
          setMapEngaged(true);
        }
      };
      map.getContainer().addEventListener("wheel", onWheel, { passive: true });

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);

      // corrige tuiles grises si conteneur était hidden au mount
      requestAnimationFrame(() => map.invalidateSize());
      setTimeout(() => map.invalidateSize(), 200);

      return () => {
        map.getContainer().removeEventListener("wheel", onWheel);
        map.off("click", engageMap);
        map.off("focus", engageMap);
        map.off("mouseout", releaseMap);
        map.off("blur", releaseMap);
        map.remove();
        mapRef.current = null;
        layerRef.current = null;
        setReady(false);
        setMapEngaged(false);
      };
    } catch (err) {
      console.warn("[map] init failed", err);
      setError("Impossible de charger la carte");
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      setReady(false);
      setMapEngaged(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init une seule fois
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || !ready) return;

    layer.clearLayers();
    const bounds = L.latLngBounds([]);

    for (const poi of nearbyPois) {
      const latLng: L.LatLngTuple = [poi.latitude, poi.longitude];
      const marker = L.marker(latLng, {
        icon: poiDivIcon(poi.category),
      }).bindPopup(
        `<div class="map-popup-body">
          <div class="map-popup-category">${escapeHtml(poi.category)}</div>
          <strong>${escapeHtml(poi.name)}</strong>
          <div class="map-popup-meta">${poi.distanceM} m du quartier</div>
        </div>`,
      );
      marker.addTo(layer);
      bounds.extend(latLng);
    }

    for (const point of points) {
      const isExact = point.coordinateSource === "exact";
      const poiKey = `${point.mapLatitude.toFixed(3)}|${point.mapLongitude.toFixed(3)}`;
      const pois = nearbyPoisByKey[poiKey] ?? nearbyPois;
      const latLng: L.LatLngTuple = [point.mapLatitude, point.mapLongitude];
      const marker = L.marker(latLng, {
        icon: priceIcon(point.price, isExact),
      }).bindPopup(buildListingPopupHtml(point, pois, locale), { maxWidth: 300 });
      marker.addTo(layer);
      bounds.extend(latLng);
    }

    if (bounds.isValid()) {
      if (points.length + nearbyPois.length > 1) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
      } else {
        map.setView(bounds.getCenter(), Math.max(zoom, 14));
      }
    }

    map.invalidateSize();
  }, [points, nearbyPoisByKey, nearbyPois, ready, locale, zoom]);

  return (
    <div className="relative h-full min-h-[400px] w-full">
      <div
        ref={mapContainer}
        className={`h-full min-h-[400px] w-full rounded-lg ${mapEngaged ? "map-engaged" : "map-scroll-safe"}`}
        style={{ zIndex: 0 }}
      />

      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-sand/40">
          <p className="rounded-lg bg-ivory/95 px-4 py-2 text-sm text-charcoal/70 shadow">
            Chargement de la carte…
          </p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-sand/40">
          <p className="rounded-lg bg-ivory/95 px-4 py-2 text-sm text-charcoal/70 shadow">{error}</p>
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
        <div className="pointer-events-none absolute left-3 top-3 z-[1000] max-w-xs rounded-lg bg-ivory/95 px-3 py-2 shadow-md">
          {neighborhoodLabel && (
            <p className="text-sm font-medium text-charcoal">{neighborhoodLabel}</p>
          )}
          <p className="text-xs text-charcoal/60">
            {points.length} annonce{points.length > 1 ? "s" : ""}
            {nearbyPois.length > 0 && ` · ${nearbyPois.length} commerces à proximité`}
            {" · "}OpenStreetMap
          </p>
        </div>
      )}

      {ready && !mapEngaged && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-md bg-charcoal/75 px-3 py-1.5 text-xs text-ivory shadow">
          Cliquez la carte pour zoomer · Ctrl + molette
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
  const listingUrl = `/${locale}/biens/${encodeURIComponent(point.slug)}`;

  let html = `<div class="map-popup-body">
    <div class="map-popup-category">${escapeHtml(point.neighborhood)} · ${escapeHtml(point.city)}</div>
    <strong>${escapeHtml(truncate(point.title, 72))}</strong>
    <div class="map-popup-price">${point.price.toLocaleString("fr-MA")} ${point.currency}</div>
    <div class="map-popup-meta">${escapeHtml(locLabel)}</div>`;

  if (pois.length > 0) {
    html += `<div style="margin-top:10px;border-top:1px solid #eee;padding-top:8px">
      <div style="font-size:10px;font-weight:600;color:#666;margin-bottom:4px">À proximité</div>
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
