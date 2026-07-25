import type { AggregationSourceConfig } from "../types";

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
    licenseStatus: process.env.AVITO_PARTNER_FEED_URL ? "partner_contract" : "pending",
    enabled: Boolean(process.env.AVITO_PARTNER_FEED_URL || process.env.PROPAPIS_API_KEY),
    description: "Nécessite contrat partenaire Avito ou flux PropAPIS licencié",
  },
  {
    id: "mubawab",
    name: "Mubawab.ma",
    website: "https://www.mubawab.ma",
    licenseStatus: process.env.MUBAWAB_PARTNER_FEED_URL ? "partner_contract" : "pending",
    enabled: Boolean(process.env.MUBAWAB_PARTNER_FEED_URL || process.env.PROPAPIS_API_KEY),
    description: "Nécessite contrat Dubizzle Group ou flux PropAPIS licencié",
  },
  {
    id: "sarouty",
    name: "Sarouty.ma",
    website: "https://www.sarouty.ma",
    licenseStatus: "pending",
    enabled: Boolean(process.env.SAROUTY_PARTNER_FEED_URL),
    description: "Partenariat à négocier",
  },
];

export function getSourceConfig(id: string): AggregationSourceConfig | undefined {
  return AGGREGATION_SOURCES.find((s) => s.id === id);
}
