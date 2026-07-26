/** Fond de carte — tuiles raster OpenStreetMap (Leaflet). */
export const DEFAULT_MAP_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export function getMapTiles(): string {
  return process.env.NEXT_PUBLIC_MAP_TILES?.trim() || DEFAULT_MAP_TILES;
}

export const MAP_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
