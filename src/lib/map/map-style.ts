/** Style MapLibre — fond OpenStreetMap réel (routes, quartiers, bâtiments). */
export const DEFAULT_MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function getMapStyle(): string {
  return process.env.NEXT_PUBLIC_MAP_STYLE?.trim() || DEFAULT_MAP_STYLE;
}

export const MAP_ATTRIBUTION =
  '© <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
