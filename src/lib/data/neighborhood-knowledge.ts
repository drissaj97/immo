import { DEMO_MARKET_METRICS } from "@/lib/data/market-data";

export type NeighborhoodKnowledge = {
  slug: string;
  city: string;
  neighborhood: string;
  region: string;
  summary: string;
  highlights: string[];
  investmentNotes: string[];
  avgPricePerSqm?: number;
  avgYield?: number;
  tags: string[];
  isDemo: true;
};

export const NEIGHBORHOOD_KNOWLEDGE: NeighborhoodKnowledge[] = [
  {
    slug: "marrakech/gueliz",
    city: "Marrakech",
    neighborhood: "Guéliz",
    region: "Marrakech-Safi",
    summary: "Quartier central de Marrakech, commerces, écoles internationales et forte demande locative expatriés.",
    highlights: ["Centre-ville historique", "Proximité commerces", "Demande location longue durée"],
    investmentNotes: ["Rendement locatif modéré", "Liquidité élevée à la revente", "Prix au m² en hausse tendancielle"],
    avgPricePerSqm: 19500,
    avgYield: 4.1,
    tags: ["centre-ville", "expatriés", "appartements"],
    isDemo: true,
  },
  {
    slug: "marrakech/amelkis",
    city: "Marrakech",
    neighborhood: "Amelkis",
    region: "Marrakech-Safi",
    summary: "Zone golf et villas haut de gamme, résidentiel premium avec faible rotation locative.",
    highlights: ["Golf Amelkis", "Villas prestige", "Sécurité et calme"],
    investmentNotes: ["Rendement plus faible", "Plus-value patrimoniale", "Clientèle haut de gamme"],
    avgPricePerSqm: 28000,
    avgYield: 3.2,
    tags: ["villas", "prestige", "golf"],
    isDemo: true,
  },
  {
    slug: "rabat/hay-riad",
    city: "Rabat",
    neighborhood: "Hay Riad",
    region: "Rabat-Salé-Kénitra",
    summary: "Quartier administratif et diplomatique, appartements standing et résidences sécurisées.",
    highlights: ["Ambassades", "Administrations", "Résidences sécurisées"],
    investmentNotes: ["Location longue durée stable", "Bon rendement net", "Demande fonctionnaires et expatriés"],
    avgPricePerSqm: 16800,
    avgYield: 4.5,
    tags: ["standing", "location", "administrations"],
    isDemo: true,
  },
  {
    slug: "casablanca/anfa",
    city: "Casablanca",
    neighborhood: "Anfa",
    region: "Casablanca-Settat",
    summary: "Quartier résidentiel premium de Casablanca, proximité corniche et commerces haut de gamme.",
    highlights: ["Corniche", "Commerces premium", "Résidences récentes"],
    investmentNotes: ["Prix élevés", "Rendement modéré", "Marché mature"],
    avgPricePerSqm: 24500,
    avgYield: 3.9,
    tags: ["premium", "corniche", "casablanca"],
    isDemo: true,
  },
  {
    slug: "sale/technopolis",
    city: "Salé",
    neighborhood: "Technopolis",
    region: "Rabat-Salé-Kénitra",
    summary: "Pôle technologique en croissance, appartements neufs et forte demande locative étudiants et jeunes actifs.",
    highlights: ["Technopolis", "Prix accessibles", "Croissance démographique"],
    investmentNotes: ["Rendement locatif élevé", "Marché locatif dynamique", "Programmes neufs"],
    avgPricePerSqm: 14200,
    avgYield: 5.6,
    tags: ["rendement", "neuf", "technopolis"],
    isDemo: true,
  },
  {
    slug: "tanger/malabata",
    city: "Tanger",
    neighborhood: "Malabata",
    region: "Tanger-Tétouan-Al Hoceïma",
    summary: "Front de mer et résidences touristiques, mix location saisonnière et résidence principale.",
    highlights: ["Vue mer", "Tourisme", "Port Tanger Med"],
    investmentNotes: ["Saisonnier possible", "Double saisonnalité", "Diversification géographique"],
    tags: ["mer", "tourisme", "tanger"],
    isDemo: true,
  },
  {
    slug: "kenitra/centre",
    city: "Kénitra",
    neighborhood: "Centre-ville",
    region: "Rabat-Salé-Kénitra",
    summary: "Ville industrielle en développement, prix d'entrée bas et potentiel rendement.",
    highlights: ["Prix accessibles", "Industrie", "Proximité Rabat"],
    investmentNotes: ["Entrée de gamme", "Rendement potentiel", "Marché moins liquide"],
    tags: ["accessibilité", "industrie"],
    isDemo: true,
  },
  {
    slug: "bouznika/plage",
    city: "Bouznika",
    neighborhood: "Front de mer",
    region: "Rabat-Salé-Kénitra",
    summary: "Littoral atlantique entre Rabat et Casablanca, appartements vue mer et location vacances.",
    highlights: ["Plage", "Résidences balnéaires", "Week-end Rabat-Casa"],
    investmentNotes: ["Rendement locatif élevé en démo", "Saisonnier + longue durée", "Marché en expansion"],
    avgPricePerSqm: 18500,
    avgYield: 6.8,
    tags: ["littoral", "mer", "rendement"],
    isDemo: true,
  },
  {
    slug: "agadir/founty",
    city: "Agadir",
    neighborhood: "Founty",
    region: "Souss-Massa",
    summary: "Station balnéaire au sud, appartements vue mer et investissement locatif saisonnier.",
    highlights: ["Plage Founty", "Tourisme", "Climat ensoleillé"],
    investmentNotes: ["Location saisonnière", "Marché touristique", "Prix modérés vs nord"],
    tags: ["mer", "tourisme", "agadir"],
    isDemo: true,
  },
  {
    slug: "fes/medina",
    city: "Fès",
    neighborhood: "Médina",
    region: "Fès-Meknès",
    summary: "Patrimoine UNESCO, riads et biens de caractère pour résidence ou hébergement touristique.",
    highlights: ["Patrimoine UNESCO", "Riads", "Tourisme culturel"],
    investmentNotes: ["Niche tourisme", "Rénovation patrimoine", "Réglementation spécifique"],
    tags: ["patrimoine", "riad", "culture"],
    isDemo: true,
  },
];

export function getNeighborhoodBySlug(slug: string): NeighborhoodKnowledge | undefined {
  return NEIGHBORHOOD_KNOWLEDGE.find((n) => n.slug === slug);
}

export function getNeighborhoodsByCity(city: string): NeighborhoodKnowledge[] {
  return NEIGHBORHOOD_KNOWLEDGE.filter(
    (n) => n.city.toLowerCase() === city.toLowerCase(),
  );
}

export function getAllNeighborhoodSlugs(): string[] {
  return NEIGHBORHOOD_KNOWLEDGE.map((n) => n.slug);
}

/** Enrich knowledge with live market metrics when available */
export function enrichWithMetrics(knowledge: NeighborhoodKnowledge): NeighborhoodKnowledge {
  const metric = DEMO_MARKET_METRICS.find(
    (m) =>
      m.city.toLowerCase() === knowledge.city.toLowerCase() &&
      m.neighborhood.toLowerCase() === knowledge.neighborhood.toLowerCase(),
  );
  if (!metric) return knowledge;
  return {
    ...knowledge,
    avgPricePerSqm: metric.avgPricePerSqm,
    avgYield: metric.avgYield,
  };
}