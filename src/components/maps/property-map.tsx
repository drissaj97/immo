"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { coordinateSourceLabel, type MapListingPoint } from "@/lib/map/listing-map-points";
import type { MapPoiPoint } from "@/lib/map/map-poi-types";
import {
  FALLBACK_MAP_TILES,
  getMapTiles,
  MAP_ATTRIBUTION,
} from "@/lib/map/map-style";

type PoiPayload = MapPoiPoint;

function formatPriceShort(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1).replace(/\.0$/, "")} M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)} k`;
  return String(price);
}

function priceIcon(price: number, exact: boolean): L.DivIcon {
  return L.divIcon({
    className: "leaflet-div-icon",
    html: `<button type="button" class="map-listing-marker ${exact ? "map-listing-marker--exact" : "map-listing-marker--approx"}"><span>${formatPriceShort(price)}</span></button>`,
    iconSize: [54, 28],
    iconAnchor: [27, 28],
    popupAnchor: [0, -24],
  });
}

function poiDivIcon(category: string): L.DivIcon {
  return L.divIcon({
    className: "leaflet-div-icon",
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
  /** Centre [lng, lat] de la zone recherchée. */
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
  const fittedKeyRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapEngaged, setMapEngaged] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map: L.Map | null = null;
    let onWheel: ((event: WheelEvent) => void) | null = null;
    let onLeave: (() => void) | null = null;
    let engageMap: (() => void) | null = null;
    let releaseMap: (() => void) | null = null;

    try {
      const initialLngLat = center ?? computeCenter(points) ?? ([-6.91, 33.92] as [number, number]);
      const touch =
        typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0);

      map = L.map(mapContainer.current, {
        center: [initialLngLat[1], initialLngLat[0]],
        zoom: points.length ? Math.max(zoom, 13) : 6,
        scrollWheelZoom: false,
        dragging: !touch,
        maxBounds: L.latLngBounds([21, -17.2], [36.0, -0.9]),
        maxBoundsViscosity: 0.7,
        minZoom: 5,
        maxZoom: 18,
      });

      const tiles = L.tileLayer(getMapTiles(), {
        attribution: MAP_ATTRIBUTION,
        maxZoom: 19,
        subdomains: "abcd",
        updateWhenIdle: true,
        keepBuffer: 2,
      });
      tiles.on("tileerror", () => {
        // Si Carto échoue, bascule OSM une fois
        if ((tiles as L.TileLayer & { _fellBack?: boolean })._fellBack) return;
        (tiles as L.TileLayer & { _fellBack?: boolean })._fellBack = true;
        tiles.setUrl(FALLBACK_MAP_TILES);
      });
      tiles.addTo(map);

      engageMap = () => {
        map?.scrollWheelZoom.enable();
        if (touch) map?.dragging.enable();
        setMapEngaged(true);
      };
      releaseMap = () => {
        map?.scrollWheelZoom.disable();
        if (touch) map?.dragging.disable();
        setMapEngaged(false);
      };

      map.on("click", engageMap);
      map.on("zoomend moveend", () => {
        map?.invalidateSize({ pan: false });
      });

      onLeave = () => releaseMap?.();
      map.getContainer().addEventListener("mouseleave", onLeave);

      onWheel = (event: WheelEvent) => {
        if (!(event.ctrlKey || event.metaKey)) return;
        if (map && !map.scrollWheelZoom.enabled()) {
          map.scrollWheelZoom.enable();
          setMapEngaged(true);
        }
      };
      map.getContainer().addEventListener("wheel", onWheel, { passive: true });

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);

      requestAnimationFrame(() => map?.invalidateSize());
      setTimeout(() => map?.invalidateSize(), 150);
      setTimeout(() => map?.invalidateSize(), 500);
    } catch (err) {
      console.warn("[map] init failed", err);
      setError("Impossible de charger la carte");
    }

    return () => {
      if (map) {
        if (onWheel) map.getContainer().removeEventListener("wheel", onWheel);
        if (onLeave) map.getContainer().removeEventListener("mouseleave", onLeave);
        if (engageMap) map.off("click", engageMap);
        map.remove();
      }
      mapRef.current = null;
      layerRef.current = null;
      fittedKeyRef.current = null;
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

    const safePoints = spiderfyClient(snapOutliersToCenter(points, center));

    const anchorLatLng: L.LatLngTuple | null = center
      ? [center[1], center[0]]
      : safePoints.length
        ? [
            safePoints.reduce((s, p) => s + p.mapLatitude, 0) / safePoints.length,
            safePoints.reduce((s, p) => s + p.mapLongitude, 0) / safePoints.length,
          ]
        : null;

    for (const poi of nearbyPois) {
      if (
        anchorLatLng &&
        haversineKm(anchorLatLng[0], anchorLatLng[1], poi.latitude, poi.longitude) > 40
      ) {
        continue;
      }
      if (!isInMorocco(poi.latitude, poi.longitude)) continue;
      const latLng: L.LatLngTuple = [poi.latitude, poi.longitude];
      L.marker(latLng, { icon: poiDivIcon(poi.category) })
        .bindPopup(
          `<div class="map-popup-body">
          <div class="map-popup-category">${escapeHtml(poi.category)}</div>
          <strong>${escapeHtml(poi.name)}</strong>
          <div class="map-popup-meta">${poi.distanceM} m du quartier</div>
        </div>`,
        )
        .addTo(layer);
    }

    for (const point of safePoints) {
      const isExact = point.coordinateSource === "exact";
      const poiKey = `${point.mapLatitude.toFixed(3)}|${point.mapLongitude.toFixed(3)}`;
      const pois = nearbyPoisByKey[poiKey] ?? [];
      const latLng: L.LatLngTuple = [point.mapLatitude, point.mapLongitude];
      L.marker(latLng, { icon: priceIcon(point.price, isExact) })
        .bindPopup(buildListingPopupHtml(point, pois, locale), { maxWidth: 300 })
        .addTo(layer);
      bounds.extend(latLng);
    }

    const fitKey = safePoints.map((p) => `${p.id}:${p.mapLatitude.toFixed(5)}`).join("|");
    if (bounds.isValid() && fittedKeyRef.current !== fitKey) {
      fittedKeyRef.current = fitKey;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const spanKm = haversineKm(sw.lat, sw.lng, ne.lat, ne.lng);

      // Points très proches → setView fixe (évite zoom max / tuiles grises)
      if (safePoints.length === 1 || spanKm < 0.35) {
        const c = bounds.getCenter();
        map.setView(c, Math.min(Math.max(zoom, 14), 16));
      } else {
        map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
      }
    } else if (!safePoints.length && center) {
      map.setView([center[1], center[0]], zoom);
    }

    map.invalidateSize({ pan: false });
  }, [points, nearbyPoisByKey, nearbyPois, ready, locale, zoom, center]);

  return (
    <div
      className={`relative h-full min-h-[400px] w-full ${mapEngaged ? "map-engaged" : "map-scroll-safe"}`}
    >
      <div ref={mapContainer} className="h-full min-h-[400px] w-full rounded-lg" style={{ zIndex: 0 }} />

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

function isInMorocco(lat: number, lng: number): boolean {
  return lat >= 20.5 && lat <= 36.2 && lng >= -17.5 && lng <= -0.8;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function snapOutliersToCenter(
  points: MapListingPoint[],
  center?: [number, number],
  maxKm = 25,
): MapListingPoint[] {
  if (!points.length) return points;

  const anchorLat = center?.[1] ?? points.reduce((s, p) => s + p.mapLatitude, 0) / points.length;
  const anchorLng = center?.[0] ?? points.reduce((s, p) => s + p.mapLongitude, 0) / points.length;

  return points.map((point) => {
    const inMa = isInMorocco(point.mapLatitude, point.mapLongitude);
    const km = haversineKm(anchorLat, anchorLng, point.mapLatitude, point.mapLongitude);
    if (inMa && km <= maxKm) return point;
    return {
      ...point,
      mapLatitude: anchorLat,
      mapLongitude: anchorLng,
      coordinateSource: point.coordinateSource === "exact" ? "neighborhood" : point.coordinateSource,
    };
  });
}

/** Écarte les pins encore empilés après snap client. */
function spiderfyClient(points: MapListingPoint[]): MapListingPoint[] {
  if (points.length <= 1) return points;
  const groups = new Map<string, number[]>();
  points.forEach((p, idx) => {
    const key = `${p.mapLatitude.toFixed(4)}|${p.mapLongitude.toFixed(4)}`;
    const arr = groups.get(key) ?? [];
    arr.push(idx);
    groups.set(key, arr);
  });

  const out = points.map((p) => ({ ...p }));
  for (const indices of groups.values()) {
    if (indices.length < 2) continue;
    const base = out[indices[0]!]!;
    const n = indices.length;
    const radius = 0.0009 + 0.00025 * Math.min(n, 12);
    indices.forEach((pointIdx, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const point = out[pointIdx]!;
      point.mapLatitude = base.mapLatitude + Math.cos(angle) * radius;
      point.mapLongitude = base.mapLongitude + Math.sin(angle) * radius;
    });
  }
  return out;
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
