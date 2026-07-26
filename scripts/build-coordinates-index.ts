#!/usr/bin/env tsx
/**
 * Construit data/cache/morocco-coordinates.json depuis Sarouty locations API + DEMO_LOCATIONS.
 */
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

type SaroutyLocation = {
  name_primary?: string;
  url_city_slug?: string;
  coordinates_lat?: string;
  coordinates_lon?: string;
  type?: string;
};

const SEARCH_TERMS = [
  "casablanca",
  "rabat",
  "sale",
  "marrakech",
  "tanger",
  "agadir",
  "fes",
  "kenitra",
  "mohammedia",
  "temara",
  "bouznika",
  "nador",
  "oujda",
  "meknes",
  "essaouira",
];

async function fetchLocations(search: string): Promise<SaroutyLocation[]> {
  const url = `https://b2c-be-prod.api.sarouty.ma/api/properties/locations?search=${encodeURIComponent(search)}`;
  const res = await fetch(url, { headers: { "User-Agent": "DarBladi/1.0" } });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: SaroutyLocation[] };
  return json.data ?? [];
}

function capitalizeCity(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

async function main() {
  const entries: Array<{ city: string; neighborhood?: string; latitude: number; longitude: number }> = [];
  const seen = new Set<string>();

  for (const term of SEARCH_TERMS) {
    const locations = await fetchLocations(term);
    for (const loc of locations) {
      const lat = Number(loc.coordinates_lat);
      const lng = Number(loc.coordinates_lon);
      // Rejeter Null Island / hors Maroc (évite marqueurs en océan).
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (Math.abs(lat) < 0.05 && Math.abs(lng) < 0.05) continue;
      if (lat < 20.5 || lat > 36.2 || lng < -17.5 || lng > -0.8) continue;

      const city = capitalizeCity(loc.url_city_slug ?? term);
      const neighborhood = loc.type === "DISTRICT" ? loc.name_primary : undefined;
      const key = `${city}|${neighborhood ?? ""}|${lat}|${lng}`;
      if (seen.has(key)) continue;
      seen.add(key);

      entries.push({ city, neighborhood, latitude: lat, longitude: lng });
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  const outDir = path.join(process.cwd(), "data/cache");
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "morocco-coordinates.json");
  writeFileSync(
    outPath,
    JSON.stringify({ builtAt: new Date().toISOString(), entries }, null, 2),
    "utf-8",
  );

  console.info(`✓ ${entries.length} coordonnées → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
