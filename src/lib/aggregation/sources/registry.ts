import type { AggregationSourceConfig } from "../types";
import { hasLocalPartnerFeed } from "./partner-feed";

function portalEnabled(source: "avito" | "mubawab" | "sarouty" | "agenz" | "yakeey"): boolean {
  const envKey = `${source.toUpperCase().replace(/-/g, "_")}_PARTNER_FEED_URL`;
  if (process.env[envKey]) return true;
  if (process.env.PROPAPIS_API_KEY && source !== "sarouty" && source !== "agenz" && source !== "yakeey") {
    return true;
  }
  if (process.env.SCRAPING_ENABLED === "true") return true;
  return hasLocalPartnerFeed(source);
}

export const AGGREGATION_SOURCES: AggregationSourceConfig[] = [
  {
    id: "holding-immo",
    name: "Holding IMMO",
    website: "https://holdingimmo.com",
    licenseStatus: "first_party",
    enabled: true,
    description: "Agence sœur — import JSON-LD autorisé",
  },
  {
    id: "semsarai",
    name: "Import catalogue (portails)",
    website: "https://darbladi.ma",
    licenseStatus: "licensed_api",
    enabled: false,
    description:
      "Ancien pipeline d'import — les annonces sont attribuées à la source originale (Mubawab, Avito, Agenz…)",
  },
  {
    id: "agenz",
    name: "Agenz.ma",
    website: "https://www.agenz.ma",
    licenseStatus: hasLocalPartnerFeed("agenz")
      ? "scraped"
      : process.env.AGENZ_PARTNER_FEED_URL
        ? "partner_contract"
        : "pending",
    enabled: portalEnabled("agenz"),
    description: "Feed scrapé (props Astro) ou import catalogue SEMSAR (source originale)",
  },
  {
    id: "yakeey",
    name: "Yakeey",
    website: "https://www.yakeey.com",
    licenseStatus: hasLocalPartnerFeed("yakeey")
      ? "scraped"
      : process.env.YAKEEY_PARTNER_FEED_URL
        ? "partner_contract"
        : "pending",
    enabled: portalEnabled("yakeey"),
    description: "Feed scrapé (meta/RSC) ou import catalogue SEMSAR (source originale)",
  },
  {
    id: "darbladi",
    name: "DarBladi",
    website: "https://darbladi.ma",
    licenseStatus: "first_party",
    enabled: true,
    description: "Annonces déposées manuellement (DepotAnnonce) — first-party DarBladi",
  },
  {
    id: "avito",
    name: "Avito.ma",
    website: "https://www.avito.ma/fr/immobilier",
    licenseStatus: hasLocalPartnerFeed("avito")
      ? "scraped"
      : process.env.AVITO_PARTNER_FEED_URL
        ? "partner_contract"
        : "pending",
    enabled: portalEnabled("avito"),
    description: "Flux partenaire, PropAPIS, ou scraping direct (SCRAPING_ENABLED + pnpm scrape:portals)",
  },
  {
    id: "mubawab",
    name: "Mubawab.ma",
    website: "https://www.mubawab.ma",
    licenseStatus: hasLocalPartnerFeed("mubawab")
      ? "scraped"
      : process.env.MUBAWAB_PARTNER_FEED_URL
        ? "partner_contract"
        : "pending",
    enabled: portalEnabled("mubawab"),
    description: "Flux partenaire, PropAPIS, ou scraping JSON-LD (pnpm scrape:portals)",
  },
  {
    id: "sarouty",
    name: "Sarouty.ma",
    website: "https://www.sarouty.ma",
    licenseStatus: hasLocalPartnerFeed("sarouty") ? "scraped" : "pending",
    enabled: portalEnabled("sarouty"),
    description: "API publique b2c-be-prod.api.sarouty.ma ou flux local scrapé",
  },
];

export function getSourceConfig(id: string): AggregationSourceConfig | undefined {
  return AGGREGATION_SOURCES.find((s) => s.id === id);
}
