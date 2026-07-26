/**
 * Fond de carte.
 * Carto (données OSM) est plus fiable que tile.openstreetmap.org
 * qui rate-limite / bloque souvent les navigateurs → carte grise.
 */
export const DEFAULT_MAP_TILES =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

/** Fallback si Carto indisponible. */
export const FALLBACK_MAP_TILES =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function getMapTiles(): string {
  return process.env.NEXT_PUBLIC_MAP_TILES?.trim() || DEFAULT_MAP_TILES;
}

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>';
