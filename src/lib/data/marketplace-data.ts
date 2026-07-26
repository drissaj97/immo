import { HOLDING_IMPORT_META } from "@/lib/data/holding-listings";

export type PartnerOrganization = {
  id: string;
  name: string;
  slug: string;
  type: "agency" | "developer" | "management" | "partner" | "other";
  description: string;
  city: string;
  isVerified: boolean;
  listingCount: number;
  website?: string;
  logoUrl?: string;
  /** Si true, les annonces du promoteur peuvent activer la réservation avec acompte. */
  depositReservationEnabled?: boolean;
};

export type PartnerProject = {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description: string;
  city: string;
  neighborhood: string;
  status: string;
  deliveryDate?: string;
};

export type PartnerProfessional = {
  id: string;
  slug: string;
  displayName: string;
  bio: string;
  city: string;
  organizationId: string;
  organizationName: string;
  isVerified: boolean;
};

/** Partenaires réels indexés par DarBladi — aucune donnée fictive. */
export const PARTNER_ORGANIZATIONS: PartnerOrganization[] = [
  {
    id: "org-holding-immo",
    name: "Holding IMMO",
    slug: "holding-immo",
    type: "agency",
    description: "Agence immobilière first-party — annonces importées avec autorisation et photos locales.",
    city: "Maroc",
    isVerified: true,
    listingCount: HOLDING_IMPORT_META.count,
    website: "https://holdingimmo.com",
  },
];

export const PARTNER_PROJECTS: PartnerProject[] = [];

export const PARTNER_PROFESSIONALS: PartnerProfessional[] = [];

/** @deprecated Utiliser PARTNER_ORGANIZATIONS */
export const DEMO_ORGANIZATIONS = PARTNER_ORGANIZATIONS;
/** @deprecated */
export const DEMO_PROJECTS = PARTNER_PROJECTS;
/** @deprecated */
export const DEMO_PROFESSIONALS = PARTNER_PROFESSIONALS;

export type DemoOrganization = PartnerOrganization;
export type DemoProject = PartnerProject;
export type DemoProfessional = PartnerProfessional;

export function getAgencies(): PartnerOrganization[] {
  return PARTNER_ORGANIZATIONS.filter((o) => o.type === "agency" || o.type === "partner");
}

export function getDevelopers(): PartnerOrganization[] {
  return PARTNER_ORGANIZATIONS.filter((o) => o.type === "developer");
}

export function getOrganizationBySlug(slug: string): PartnerOrganization | undefined {
  return PARTNER_ORGANIZATIONS.find((o) => o.slug === slug);
}

export function getProjectsByOrganization(_orgId: string): PartnerProject[] {
  return [];
}

export function getProfessionalBySlug(_slug: string): PartnerProfessional | undefined {
  return undefined;
}
