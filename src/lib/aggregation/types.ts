import type { DemoListing } from "@/lib/data/demo-data";

/** Sources agrégées — activation via contrat partenaire ou API licenciée */
export type AggregationSourceId =
  | "samsar-ia"
  | "holding-immo"
  | "avito"
  | "mubawab"
  | "sarouty";

export type AggregationLicenseStatus =
  | "first_party"
  | "partner_contract"
  | "licensed_api"
  | "pending"
  | "disabled";

export type RawPartnerListing = {
  externalId: string;
  title: string;
  description?: string;
  price: number;
  currency?: "MAD" | "EUR" | "USD";
  transactionType?: "sale" | "long_term_rent" | "seasonal_rent";
  listingType?: "apartment" | "villa" | "riad" | "land" | "commercial";
  city: string;
  neighborhood?: string;
  region?: string;
  livingArea?: number;
  landArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
  sourceUrl: string;
  publishedAt?: string;
  advertiserName?: string;
};

export type PartnerFeedFile = {
  source: AggregationSourceId;
  licenseRef?: string;
  licenseStatus: AggregationLicenseStatus;
  syncedAt: string;
  listings: RawPartnerListing[];
};

export type AggregationSourceConfig = {
  id: AggregationSourceId;
  name: string;
  website: string;
  licenseStatus: AggregationLicenseStatus;
  enabled: boolean;
  description: string;
};

export type AggregationSyncResult = {
  source: string;
  imported: number;
  skipped: number;
  errors: string[];
};

export type AggregatedListing = DemoListing & {
  aggregationSource: AggregationSourceId;
  isExternal: boolean;
  licenseStatus: AggregationLicenseStatus;
};

export type AggregationStats = {
  total: number;
  published: number;
  bySource: Record<string, number>;
  cities: number;
  lastSyncAt: string | null;
  sources: AggregationSourceConfig[];
};
