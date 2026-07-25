export type DemoLocation = {
  id: string;
  city: string;
  neighborhood: string;
  region: string;
  slug: string;
  latitude: number;
  longitude: number;
};

export type DemoListing = {
  id: string;
  slug: string;
  title: string;
  description: string;
  transactionType: "sale" | "long_term_rent" | "seasonal_rent";
  listingType: "apartment" | "villa" | "riad" | "land" | "commercial";
  status: "draft" | "pending_review" | "published" | "archived" | "rejected";
  price: number;
  currency: "MAD" | "EUR" | "USD";
  livingArea?: number;
  landArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  hasPool?: boolean;
  hasParking?: boolean;
  hasGarden?: boolean;
  hasTerrace?: boolean;
  hasElevator?: boolean;
  isFurnished?: boolean;
  hasTitleDeed?: boolean;
  isNew?: boolean;
  location: DemoLocation;
  latitude: number;
  longitude: number;
  reference: string;
  images: string[];
  sourceType: string;
  sourceName: string;
  sourceUrl?: string;
  externalId?: string;
  completenessScore: number;
  freshnessScore: number;
  isVerified: boolean;
  isDemo: true | false;
  publishedAt: string;
  estimatedYield?: number;
};

export const DEMO_LOCATIONS: DemoLocation[] = [
  { id: "loc-marrakech-gueliz", city: "Marrakech", neighborhood: "Guéliz", region: "Marrakech-Safi", slug: "marrakech/gueliz", latitude: 31.634, longitude: -7.999 },
  { id: "loc-marrakech-amelkis", city: "Marrakech", neighborhood: "Amelkis", region: "Marrakech-Safi", slug: "marrakech/amelkis", latitude: 31.592, longitude: -7.962 },
  { id: "loc-rabat-hay-riad", city: "Rabat", neighborhood: "Hay Riad", region: "Rabat-Salé-Kénitra", slug: "rabat/hay-riad", latitude: 33.969, longitude: -6.849 },
  { id: "loc-casa-anfa", city: "Casablanca", neighborhood: "Anfa", region: "Casablanca-Settat", slug: "casablanca/anfa", latitude: 33.589, longitude: -7.664 },
  { id: "loc-sale-technopolis", city: "Salé", neighborhood: "Technopolis", region: "Rabat-Salé-Kénitra", slug: "sale/technopolis", latitude: 34.018, longitude: -6.738 },
  { id: "loc-sale-sala-jadida", city: "Salé", neighborhood: "Sala El Jadida", region: "Rabat-Salé-Kénitra", slug: "sale/sala-el-jadida", latitude: 34.045, longitude: -6.812 },
  { id: "loc-sale-bettana", city: "Salé", neighborhood: "Bettana", region: "Rabat-Salé-Kénitra", slug: "sale/bettana", latitude: 34.032, longitude: -6.825 },
  { id: "loc-sale-tabriquet", city: "Salé", neighborhood: "Tabriquet", region: "Rabat-Salé-Kénitra", slug: "sale/tabriquet", latitude: 34.058, longitude: -6.798 },
  { id: "loc-sale-bouknadel", city: "Salé", neighborhood: "Bouknadel", region: "Rabat-Salé-Kénitra", slug: "sale/bouknadel", latitude: 34.065, longitude: -6.742 },
  { id: "loc-casa-maarif", city: "Casablanca", neighborhood: "Maârif", region: "Casablanca-Settat", slug: "casablanca/maarif", latitude: 33.583, longitude: -7.632 },
  { id: "loc-tanger-malabata", city: "Tanger", neighborhood: "Malabata", region: "Tanger-Tétouan-Al Hoceïma", slug: "tanger/malabata", latitude: 35.776, longitude: -5.785 },
  { id: "loc-kenitra-centre", city: "Kénitra", neighborhood: "Centre-ville", region: "Rabat-Salé-Kénitra", slug: "kenitra/centre", latitude: 34.261, longitude: -6.582 },
  { id: "loc-bouznika-plage", city: "Bouznika", neighborhood: "Front de mer", region: "Rabat-Salé-Kénitra", slug: "bouznika/plage", latitude: 33.789, longitude: -7.159 },
  { id: "loc-agadir-founty", city: "Agadir", neighborhood: "Founty", region: "Souss-Massa", slug: "agadir/founty", latitude: 30.41, longitude: -9.6 },
  { id: "loc-essaouira-medina", city: "Essaouira", neighborhood: "Médina", region: "Marrakech-Safi", slug: "essaouira/medina", latitude: 31.508, longitude: -9.77 },
  { id: "loc-tetouan-martil", city: "Tétouan", neighborhood: "Martil", region: "Tanger-Tétouan-Al Hoceïma", slug: "tetouan/martil", latitude: 35.627, longitude: -5.274 },
  { id: "loc-meknes-hamria", city: "Meknès", neighborhood: "Hamria", region: "Fès-Meknès", slug: "meknes/hamria", latitude: 33.895, longitude: -5.554 },
  { id: "loc-oujda-centre", city: "Oujda", neighborhood: "Centre-ville", region: "Oriental", slug: "oujda/centre", latitude: 34.687, longitude: -1.911 },
  { id: "loc-el-jadida-port", city: "El Jadida", neighborhood: "Port", region: "Casablanca-Settat", slug: "el-jadida/port", latitude: 33.231, longitude: -8.5 },
  { id: "loc-fes-medina", city: "Fès", neighborhood: "Médina", region: "Fès-Meknès", slug: "fes/medina", latitude: 34.063, longitude: -4.973 },
  { id: "loc-nador-marchica", city: "Nador", neighborhood: "Marchica", region: "Oriental", slug: "nador/marchica", latitude: 35.168, longitude: -2.933 },
  { id: "loc-safi-medina", city: "Safi", neighborhood: "Médina", region: "Marrakech-Safi", slug: "safi/medina", latitude: 32.299, longitude: -9.237 },
  { id: "loc-mohammedia-corniche", city: "Mohammedia", neighborhood: "Corniche", region: "Casablanca-Settat", slug: "mohammedia/corniche", latitude: 33.686, longitude: -7.383 },
  { id: "loc-settat-centre", city: "Settat", neighborhood: "Centre-ville", region: "Casablanca-Settat", slug: "settat/centre", latitude: 33.001, longitude: -7.616 },
  { id: "loc-beni-mellal-hay", city: "Beni Mellal", neighborhood: "Hay Mohammadi", region: "Béni Mellal-Khénifra", slug: "beni-mellal/hay-mohammadi", latitude: 32.337, longitude: -6.36 },
  { id: "loc-khouribga-centre", city: "Khouribga", neighborhood: "Centre-ville", region: "Béni Mellal-Khénifra", slug: "khouribga/centre", latitude: 32.884, longitude: -6.906 },
  { id: "loc-laayoune-centre", city: "Laâyoune", neighborhood: "Centre-ville", region: "Laâyoune-Sakia El Hamra", slug: "laayoune/centre", latitude: 27.153, longitude: -13.203 },
  { id: "loc-dakhla-lagune", city: "Dakhla", neighborhood: "Lagune", region: "Dakhla-Oued Ed-Dahab", slug: "dakhla/lagune", latitude: 23.716, longitude: -15.932 },
];

const PLACEHOLDER = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80";

export const DEMO_LISTINGS: DemoListing[] = [];

export const DEMO_USERS = [
  {
    id: "user-admin",
    email: "admin@darbladi.demo",
    password: "Admin123!",
    role: "admin" as const,
    fullName: "Admin Démo",
  },
  {
    id: "user-agent",
    email: "agent@darbladi.demo",
    password: "Agent123!",
    role: "agent" as const,
    fullName: "Agent Professionnel Démo",
  },
  {
    id: "user-buyer",
    email: "acheteur@darbladi.demo",
    password: "Acheteur123!",
    role: "buyer" as const,
    fullName: "Acheteur Démo",
  },
];

export const EXCHANGE_RATES = {
  MAD: 1,
  EUR: 0.092,
  USD: 0.1,
  source: "Banque Al-Maghrib (indicatif, démo)",
  date: "2026-07-01",
};
