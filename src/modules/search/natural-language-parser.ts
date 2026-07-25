import { z } from "zod";

export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  transactionType: z.enum(["sale", "long_term_rent", "seasonal_rent"]).optional(),
  listingType: z.enum(["apartment", "villa", "riad", "land", "commercial", "office"]).optional(),
  city: z.string().optional(),
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
  source: z.enum(["darbladi", "holding-immo", "avito", "mubawab", "sarouty"]).optional(),
  /** Inclure les annonces fictives (Unsplash). Défaut : false côté UI publique. */
  includeDemo: z.boolean().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

const CITY_ALIASES: Record<string, string> = {
  marrakech: "Marrakech",
  rabat: "Rabat",
  casablanca: "Casablanca",
  casa: "Casablanca",
  sale: "Salé",
  salé: "Salé",
  tanger: "Tanger",
  kenitra: "Kénitra",
  kénitra: "Kénitra",
  bouznika: "Bouznika",
  gueliz: "Guéliz",
  guéliz: "Guéliz",
  "hay riad": "Hay Riad",
  technopolis: "Technopolis",
  amelkis: "Amelkis",
};

const TYPE_PATTERNS: Array<{ pattern: RegExp; type: SearchFilters["listingType"] }> = [
  { pattern: /\b(f\d|appartement|studio|t\d)\b/i, type: "apartment" },
  { pattern: /\b(villa)\b/i, type: "villa" },
  { pattern: /\b(riad)\b/i, type: "riad" },
  { pattern: /\b(terrain)\b/i, type: "land" },
  { pattern: /\b(commerce|local)\b/i, type: "commercial" },
];

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

  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (lower.includes(alias)) {
      if (["Gueliz", "Amelkis", "Hay Riad", "Technopolis"].includes(city)) {
        filters.neighborhood = city;
        assumptions.push(`Quartier identifié : ${city}`);
      } else if (!filters.city) {
        filters.city = city;
      }
    }
  }

  if (!filters.city && !filters.neighborhood) {
    missing.push("Ville ou quartier");
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
