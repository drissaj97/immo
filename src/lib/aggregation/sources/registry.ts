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
    id: "samsar-ia",
    name: "Samsar IA",
    website: "https://samsar.ma",
    licenseStatus: "first_party",
    enabled: true,
    description: "Annonces publiées directement sur la plateforme",
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
