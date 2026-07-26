import { normalizeLocationKey } from "@/lib/search/location-match";

/** Communes périphériques souvent taguées comme quartier de Casablanca/Rabat. */
const STANDALONE_COMMUNES = new Set([
  "bouskoura",
  "mohammedia",
  "temara",
  "mediouna",
  "nouaceur",
  "berrechid",
  "benguerir",
  "skhirate",
  "harhoura",
  "ain harrouda",
  "ainharrouda",
  "dar bouazza",
  "darbouazza",
  "sidi rahal",
  "sidirahal",
]);

export function resolvePartnerLocation(raw: {
  city: string;
  neighborhood?: string;
}): { city: string; neighborhood: string } {
  const city = raw.city?.trim() || "Maroc";
  const hood = raw.neighborhood?.trim() || city;
  const cityKey = normalizeLocationKey(city);
  const hoodKey = normalizeLocationKey(hood);

  if (hood && STANDALONE_COMMUNES.has(hoodKey) && cityKey !== hoodKey) {
    return { city: hood, neighborhood: hood };
  }

  return { city, neighborhood: hood };
}
