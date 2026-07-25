import type { AggregationSourceConfig } from "../types";
import { hasLocalPartnerFeed } from "./partner-feed";

function portalEnabled(source: "avito" | "mubawab" | "sarouty"): boolean {
  if (process.env[`${source.toUpperCase()}_PARTNER_FEED_URL`]) return true;
  if (process.env.PROPAPIS_API_KEY && source !== "sarouty") return true;
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
    name: "SEMSAR AI",
    website: "https://www.semsarai.ma",
    licenseStatus: "licensed_api",
    enabled: true,
    description: "Agrégateur semsarai.ma — import API publique (~73k annonces Maroc)",
  },
  {
    id: "darbladi",
    name: "DarBladi",
    website: "https://darbladi.ma",
    licenseStatus: "first_party",
    enabled: false,
    description: "Publications directes — nécessite DATABASE_URL (pas de données fictives)",
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
