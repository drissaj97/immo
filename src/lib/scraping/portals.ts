import type { AggregationSourceId } from "@/lib/aggregation/types";
import type { ScrapePortal } from "./types";

export type MoroccoPortalTier = 1 | 2 | 3;

export type MoroccoPortalMeta = {
  id: string;
  name: string;
  website: string;
  tier: MoroccoPortalTier;
  focus: string;
  scrapeStatus: "implemented" | "planned" | "blocked" | "out_of_scope";
  scrapePortal?: ScrapePortal;
  aggregationSource?: AggregationSourceId;
  method?: string;
  notes: string;
};

/** Portails immobiliers / annonces les plus utilisés au Maroc. */
export const MOROCCO_PORTALS: MoroccoPortalMeta[] = [
  {
    id: "avito",
    name: "Avito.ma",
    website: "https://www.avito.ma",
    tier: 1,
    focus: "Annonces générales + immobilier",
    scrapeStatus: "implemented",
    scrapePortal: "avito",
    aggregationSource: "avito",
    method: "Playwright + __NEXT_DATA__",
    notes: "Volume élevé ; Cloudflare peut bloquer les IP datacenter.",
  },
  {
    id: "mubawab",
    name: "Mubawab.ma",
    website: "https://www.mubawab.ma",
    tier: 1,
    focus: "Immobilier (Dubizzle / EMPG)",
    scrapeStatus: "implemented",
    scrapePortal: "mubawab",
    aggregationSource: "mubawab",
    method: "HTML + JSON-LD",
    notes: "Fiches riches via RealEstateListing JSON-LD.",
  },
  {
    id: "sarouty",
    name: "Sarouty.ma",
    website: "https://www.sarouty.ma",
    tier: 1,
    focus: "Immobilier",
    scrapeStatus: "implemented",
    scrapePortal: "sarouty",
    aggregationSource: "sarouty",
    method: "API publique b2c-be-prod",
    notes: "Le plus rapide (~50k annonces paginées).",
  },
  {
    id: "agenz",
    name: "Agenz.ma",
    website: "https://www.agenz.ma",
    tier: 1,
    focus: "Immobilier pro / agents",
    scrapeStatus: "implemented",
    scrapePortal: "agenz",
    aggregationSource: "agenz",
    method: "HTML + props Astro island",
    notes: "Prix, surface, chambres, photos, téléphone agent.",
  },
  {
    id: "yakeey",
    name: "Yakeey",
    website: "https://www.yakeey.com",
    tier: 1,
    focus: "Transaction sécurisée / iBuying",
    scrapeStatus: "implemented",
    scrapePortal: "yakeey",
    aggregationSource: "yakeey",
    method: "HTML + meta/RSC",
    notes: "IDs type ca202105 ; prix et caractéristiques dans og/meta.",
  },
  {
    id: "propertyfinder",
    name: "Property Finder Maroc",
    website: "https://www.propertyfinder.ma",
    tier: 2,
    focus: "Immobilier premium",
    scrapeStatus: "planned",
    notes: "Présence Maroc limitée vs Golfe ; à sonder (API/SSR).",
  },
  {
    id: "bayut",
    name: "Bayut",
    website: "https://www.bayut.com",
    tier: 2,
    focus: "Immobilier MENA",
    scrapeStatus: "planned",
    notes: "Couverture Maroc à confirmer avant scraper dédié.",
  },
  {
    id: "jibli",
    name: "Jibli.ma",
    website: "https://www.jibli.ma",
    tier: 2,
    focus: "Annonces locales",
    scrapeStatus: "planned",
    notes: "Volume immobilier variable — probe HTML avant intégration.",
  },
  {
    id: "wandaloo",
    name: "Wandaloo",
    website: "https://www.wandaloo.com",
    tier: 3,
    focus: "Auto (immo faible)",
    scrapeStatus: "out_of_scope",
    notes: "Principalement véhicules — hors scope immo DarBladi.",
  },
  {
    id: "semsarai",
    name: "SemsarAI",
    website: "https://semsarai.ma",
    tier: 2,
    focus: "Agrégateur / import API",
    scrapeStatus: "implemented",
    aggregationSource: "semsarai",
    method: "API licenciée (import:semsarai)",
    notes: "Déjà importé via pipeline dédié, pas via scrape:portals.",
  },
  {
    id: "holding-immo",
    name: "Holding IMMO",
    website: "https://holdingimmo.com",
    tier: 2,
    focus: "Agence sœur first-party",
    scrapeStatus: "implemented",
    aggregationSource: "holding-immo",
    method: "JSON-LD first-party",
    notes: "Import autorisé — pas du scraping tiers.",
  },
];

export const SCRAPE_PORTAL_IDS: ScrapePortal[] = [
  "sarouty",
  "mubawab",
  "avito",
  "agenz",
  "yakeey",
];

export function isScrapePortal(value: string): value is ScrapePortal {
  return (SCRAPE_PORTAL_IDS as string[]).includes(value);
}

export function listImplementedScrapePortals(): MoroccoPortalMeta[] {
  return MOROCCO_PORTALS.filter((p) => p.scrapeStatus === "implemented" && p.scrapePortal);
}
