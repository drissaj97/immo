import { z } from "zod";
import { resolveMoroccoRegion } from "@/lib/geography/morocco-regions";

export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  transactionType: z.enum(["sale", "long_term_rent", "seasonal_rent"]).optional(),
  listingType: z.enum(["apartment", "villa", "riad", "land", "commercial", "office"]).optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  neighborhood: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minArea: z.number().optional(),
  maxArea: z.number().optional(),
  bedrooms: z.number().optional(),
  hasPool: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isNew: z.boolean().optional(),
  sort: z.enum(["recent", "price_asc", "price_desc", "area_desc"]).optional(),
  source: z.enum(["darbladi", "holding-immo", "semsarai", "avito", "mubawab", "sarouty"]).optional(),
  /** Inclure les annonces fictives (Unsplash). Défaut : false côté UI publique. */
  includeDemo: z.boolean().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

type LocationAlias = {
  city: string;
  region: string;
  neighborhood?: string;
};

/** Alias triés du plus long au plus court pour éviter les matches partiels. */
const LOCATION_ALIAS_ENTRIES: Array<[string, LocationAlias]> = [
  ["sala el jadida", { city: "Salé", region: "Rabat-Salé-Kénitra", neighborhood: "Sala El Jadida" }],
  ["sale el jadida", { city: "Salé", region: "Rabat-Salé-Kénitra", neighborhood: "Sala El Jadida" }],
  ["sala al jadida", { city: "Salé", region: "Rabat-Salé-Kénitra", neighborhood: "Sala El Jadida" }],
  ["bouskoura victoria", { city: "Bouskoura", region: "Casablanca-Settat", neighborhood: "Victoria" }],
  ["victoria city", { city: "Bouskoura", region: "Casablanca-Settat", neighborhood: "Victoria" }],
  ["quartier victoria", { city: "Bouskoura", region: "Casablanca-Settat", neighborhood: "Victoria" }],
  ["victoria bouskoura", { city: "Bouskoura", region: "Casablanca-Settat", neighborhood: "Victoria" }],
  ["ville verte", { city: "Bouskoura", region: "Casablanca-Settat", neighborhood: "Ville Verte" }],
  ["hay riad", { city: "Rabat", region: "Rabat-Salé-Kénitra", neighborhood: "Hay Riad" }],
  ["technopolis", { city: "Salé", region: "Rabat-Salé-Kénitra", neighborhood: "Technopolis" }],
  ["bouknadel", { city: "Salé", region: "Rabat-Salé-Kénitra", neighborhood: "Bouknadel" }],
  ["bettana", { city: "Salé", region: "Rabat-Salé-Kénitra", neighborhood: "Bettana" }],
  ["tabriquet", { city: "Salé", region: "Rabat-Salé-Kénitra", neighborhood: "Tabriquet" }],
  ["gueliz", { city: "Marrakech", region: "Marrakech-Safi", neighborhood: "Guéliz" }],
  ["guéliz", { city: "Marrakech", region: "Marrakech-Safi", neighborhood: "Guéliz" }],
  ["amelkis", { city: "Marrakech", region: "Marrakech-Safi", neighborhood: "Amelkis" }],
  ["hivernage", { city: "Marrakech", region: "Marrakech-Safi", neighborhood: "Hivernage" }],
  ["maarif", { city: "Casablanca", region: "Casablanca-Settat", neighborhood: "Maarif" }],
  ["anfa", { city: "Casablanca", region: "Casablanca-Settat", neighborhood: "Anfa" }],
  ["victoria", { city: "Bouskoura", region: "Casablanca-Settat", neighborhood: "Victoria" }],
  ["bouskoura", { city: "Bouskoura", region: "Casablanca-Settat" }],
  ["mohammedia", { city: "Mohammedia", region: "Casablanca-Settat" }],
  ["marrakech", { city: "Marrakech", region: "Marrakech-Safi" }],
  ["rabat", { city: "Rabat", region: "Rabat-Salé-Kénitra" }],
  ["casablanca", { city: "Casablanca", region: "Casablanca-Settat" }],
  ["casa", { city: "Casablanca", region: "Casablanca-Settat" }],
  ["sale", { city: "Salé", region: "Rabat-Salé-Kénitra" }],
  ["salé", { city: "Salé", region: "Rabat-Salé-Kénitra" }],
  ["tanger", { city: "Tanger", region: "Tanger-Tétouan-Al Hoceïma" }],
  ["kenitra", { city: "Kénitra", region: "Rabat-Salé-Kénitra" }],
  ["kénitra", { city: "Kénitra", region: "Rabat-Salé-Kénitra" }],
  ["bouznika", { city: "Bouznika", region: "Rabat-Salé-Kénitra" }],
  ["agadir", { city: "Agadir", region: "Souss-Massa" }],
  ["fes", { city: "Fès", region: "Fès-Meknès" }],
  ["fès", { city: "Fès", region: "Fès-Meknès" }],
];

const LOCATION_ALIASES = [...LOCATION_ALIAS_ENTRIES].sort((a, b) => b[0].length - a[0].length);

const TYPE_PATTERNS: Array<{ pattern: RegExp; type: SearchFilters["listingType"] }> = [
  { pattern: /\b(f\d|appartement|studio|t\d)\b/i, type: "apartment" },
  { pattern: /\b(villa)\b/i, type: "villa" },
  { pattern: /\b(riad)\b/i, type: "riad" },
  { pattern: /\b(terrain)\b/i, type: "land" },
  { pattern: /\b(commerce|local)\b/i, type: "commercial" },
];

function applyLocationAlias(filters: SearchFilters, alias: LocationAlias, label: string, assumptions: string[]) {
  filters.city = alias.city;
  filters.region = alias.region;
  if (alias.neighborhood) {
    filters.neighborhood = alias.neighborhood;
    assumptions.push(`Quartier identifié : ${alias.neighborhood} (${alias.city})`);
  } else {
    assumptions.push(`Ville identifiée : ${alias.city}`);
  }
}

/** Parseur simple sans LLM — mode démonstration */
export function parseNaturalLanguageQuery(text: string): {
  filters: SearchFilters;
  assumptions: string[];
  missing: string[];
} {
  const lower = text.toLowerCase();
  const filters: SearchFilters = {};
  const assumptions: string[] = [];
  const missing: string[] = [];

  if (/\b(louer|location|loyer)\b/i.test(text)) {
    filters.transactionType = /\b(court|saison|airbnb|nuit)\b/i.test(text)
      ? "seasonal_rent"
      : "long_term_rent";
  } else if (/\b(airbnb|saisonnier|seasonal)\b/i.test(text)) {
    filters.transactionType = "seasonal_rent";
  } else if (/\b(acheter|achat|vendre|investir|investissement)\b/i.test(text)) {
    filters.transactionType = "sale";
  } else {
    assumptions.push("Type de transaction non précisé — recherche vente par défaut");
    filters.transactionType = "sale";
  }

  for (const [alias, location] of LOCATION_ALIASES) {
    if (lower.includes(alias) && location.neighborhood) {
      applyLocationAlias(filters, location, alias, assumptions);
      break;
    }
  }

  if (!filters.city) {
    for (const [alias, location] of LOCATION_ALIASES) {
      if (lower.includes(alias) && !location.neighborhood) {
        applyLocationAlias(filters, location, alias, assumptions);
        break;
      }
    }
  }

  if (filters.city && !filters.region) {
    filters.region = String(resolveMoroccoRegion(filters.city));
  }

  if (!filters.neighborhood) {
    missing.push("Quartier");
  }
  if (!filters.city) {
    missing.push("Ville");
  }

  for (const { pattern, type } of TYPE_PATTERNS) {
    if (pattern.test(text)) {
      filters.listingType = type;
      break;
    }
  }

  const fMatch = text.match(/\bf\s?(\d)\b/i);
  if (fMatch) {
    filters.bedrooms = Math.max(1, parseInt(fMatch[1], 10) - 1);
    filters.listingType = "apartment";
  }

  const bedroomMatch = text.match(/(\d+)\s*(chambre|ch\.)/i);
  if (bedroomMatch) {
    filters.bedrooms = parseInt(bedroomMatch[1], 10);
  }

  const priceMad = text.match(/([\d\s]+)\s*(dh|mad|dirham)/i);
  const priceEur = text.match(/([\d\s]+)\s*(€|eur|euro)/i);
  if (priceMad) {
    const value = parseInt(priceMad[1].replace(/\s/g, ""), 10);
    if (/\b(moins|max|jusqu|under|<)\b/i.test(text)) {
      filters.maxPrice = value;
    } else {
      filters.minPrice = value * 0.8;
      filters.maxPrice = value * 1.2;
      assumptions.push(`Budget interprété autour de ${value.toLocaleString("fr-MA")} MAD`);
    }
  } else if (priceEur) {
    const value = parseInt(priceEur[1].replace(/\s/g, ""), 10);
    filters.maxPrice = Math.round(value / 0.092);
    assumptions.push(`Budget converti depuis ${value.toLocaleString("fr-FR")} EUR (taux indicatif démo)`);
  } else if (/\b(budget|moins de|max)\b/i.test(text)) {
    missing.push("Montant du budget");
  }

  if (/\b(piscine)\b/i.test(text)) filters.hasPool = true;
  if (/\b(parking|garage)\b/i.test(text)) filters.hasParking = true;
  if (/\b(neuf|programme|livraison)\b/i.test(text)) filters.isNew = true;
  if (/\b(vérifi|verifi|certifi)\b/i.test(text)) filters.isVerified = true;
  if (/\b(rentable|rendement|cash[- ]?flow|airbnb)\b/i.test(text)) {
    assumptions.push("Critère rentabilité — tri par rendement estimé");
    filters.sort = "recent";
  }

  return { filters: searchFiltersSchema.parse(filters), assumptions, missing };
}
