export type DemoOrganization = {
  id: string;
  name: string;
  slug: string;
  type: "agency" | "developer" | "management" | "partner" | "other";
  description: string;
  city: string;
  isVerified: boolean;
  listingCount: number;
  logoUrl?: string;
};

export type DemoProject = {
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

export type DemoProfessional = {
  id: string;
  slug: string;
  displayName: string;
  bio: string;
  city: string;
  organizationId: string;
  organizationName: string;
  isVerified: boolean;
};

export const DEMO_ORGANIZATIONS: DemoOrganization[] = [
  {
    id: "org-atlas-premium",
    name: "Atlas Premium Immobilier",
    slug: "atlas-premium-immobilier",
    type: "agency",
    description: "Agence haut de gamme spécialisée Marrakech et littoral atlantique. Données fictives.",
    city: "Marrakech",
    isVerified: true,
    listingCount: 4,
  },
  {
    id: "org-capital-homes",
    name: "Capital Homes Rabat",
    slug: "capital-homes-rabat",
    type: "agency",
    description: "Résidences et appartements neufs à Rabat-Salé-Kénitra. Données fictives.",
    city: "Rabat",
    isVerified: true,
    listingCount: 3,
  },
  {
    id: "org-anfa-living",
    name: "Anfa Living",
    slug: "anfa-living",
    type: "agency",
    description: "Biens d'exception à Casablanca, quartiers Anfa et Ain Diab. Données fictives.",
    city: "Casablanca",
    isVerified: false,
    listingCount: 2,
  },
  {
    id: "org-palm-promotion",
    name: "Palm Promotion",
    slug: "palm-promotion",
    type: "developer",
    description: "Promoteur de programmes neufs résidentiels et mixtes. Données fictives.",
    city: "Marrakech",
    isVerified: true,
    listingCount: 0,
  },
  {
    id: "org-riviera-dev",
    name: "Riviera Développement",
    slug: "riviera-developpement",
    type: "developer",
    description: "Programmes front de mer Bouznika et littoral nord. Données fictives.",
    city: "Bouznika",
    isVerified: true,
    listingCount: 0,
  },
];

export const DEMO_PROJECTS: DemoProject[] = [
  {
    id: "proj-residence-gueliz",
    organizationId: "org-palm-promotion",
    slug: "residence-gueliz-gardens",
    name: "Résidence Guéliz Gardens",
    description: "Programme neuf 48 appartements F2 à F4, parking et rooftop. Livraison T4 2027. Fictif.",
    city: "Marrakech",
    neighborhood: "Guéliz",
    status: "selling",
    deliveryDate: "2027-06-01",
  },
  {
    id: "proj-hay-riad-park",
    organizationId: "org-palm-promotion",
    slug: "hay-riad-park",
    name: "Hay Riad Park",
    description: "Villas jumelées et appartements standing, résidence sécurisée. Fictif.",
    city: "Rabat",
    neighborhood: "Hay Riad",
    status: "selling",
    deliveryDate: "2026-12-01",
  },
  {
    id: "proj-bouznika-marina",
    organizationId: "org-riviera-dev",
    slug: "bouznika-marina-view",
    name: "Bouznika Marina View",
    description: "Appartements vue mer, commerces en RDC. Fictif.",
    city: "Bouznika",
    neighborhood: "Front de mer",
    status: "presale",
    deliveryDate: "2028-03-01",
  },
];

export const DEMO_PROFESSIONALS: DemoProfessional[] = [
  {
    id: "pro-yasmine-el-amrani",
    slug: "yasmine-el-amrani",
    displayName: "Yasmine El Amrani",
    bio: "Consultante investissement locatif — Marrakech & littoral. Donnée fictive.",
    city: "Marrakech",
    organizationId: "org-atlas-premium",
    organizationName: "Atlas Premium Immobilier",
    isVerified: true,
  },
  {
    id: "pro-omar-benjelloun",
    slug: "omar-benjelloun",
    displayName: "Omar Benjelloun",
    bio: "Agent senior résidentiel Rabat. Donnée fictive.",
    city: "Rabat",
    organizationId: "org-capital-homes",
    organizationName: "Capital Homes Rabat",
    isVerified: true,
  },
  {
    id: "pro-laila-chraibi",
    slug: "laila-chraibi",
    displayName: "Laila Chraibi",
    bio: "Spécialiste programmes neufs Casablanca. Donnée fictive.",
    city: "Casablanca",
    organizationId: "org-anfa-living",
    organizationName: "Anfa Living",
    isVerified: false,
  },
];

export function getAgencies(): DemoOrganization[] {
  return DEMO_ORGANIZATIONS.filter((o) => o.type === "agency");
}

export function getDevelopers(): DemoOrganization[] {
  return DEMO_ORGANIZATIONS.filter((o) => o.type === "developer");
}

export function getOrganizationBySlug(slug: string): DemoOrganization | undefined {
  return DEMO_ORGANIZATIONS.find((o) => o.slug === slug);
}

export function getProjectsByOrganization(orgId: string): DemoProject[] {
  return DEMO_PROJECTS.filter((p) => p.organizationId === orgId);
}

export function getProfessionalBySlug(slug: string): DemoProfessional | undefined {
  return DEMO_PROFESSIONALS.find((p) => p.slug === slug);
}
