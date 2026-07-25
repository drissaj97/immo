export type PriceHistoryPoint = {
  date: string;
  price: number;
  event?: "listed" | "price_drop" | "price_raise" | "verified";
};

export type MarketMetric = {
  city: string;
  neighborhood: string;
  listingType: string;
  avgPricePerSqm: number;
  avgRentPerSqm: number;
  avgYield: number;
  sampleSize: number;
  updatedAt: string;
  source: string;
  isDemo: true;
};

export type Comparable = {
  id: string;
  listingId?: string;
  title: string;
  city: string;
  neighborhood: string;
  price: number;
  livingArea: number;
  pricePerSqm: number;
  soldAt?: string;
  distanceKm?: number;
  isDemo: true;
};

/** Historique fictif par référence annonce */
export const DEMO_PRICE_HISTORY: Record<string, PriceHistoryPoint[]> = {
  "SA-D001": [
    { date: "2025-11-01", price: 1950000, event: "listed" },
    { date: "2026-02-15", price: 1900000, event: "price_drop" },
    { date: "2026-05-01", price: 1850000, event: "verified" },
  ],
  "SA-D002": [
    { date: "2025-06-01", price: 13200000, event: "listed" },
    { date: "2026-01-10", price: 12800000, event: "price_drop" },
    { date: "2026-06-15", price: 12500000, event: "verified" },
  ],
  "SA-D004": [
    { date: "2025-09-01", price: 7200000, event: "listed" },
    { date: "2026-03-01", price: 7000000, event: "price_drop" },
    { date: "2026-07-05", price: 6800000, event: "verified" },
  ],
  "SA-D005": [
    { date: "2026-04-01", price: 1350000, event: "listed" },
    { date: "2026-06-01", price: 1300000, event: "price_drop" },
    { date: "2026-07-20", price: 1280000, event: "verified" },
  ],
  "SA-D006": [
    { date: "2025-12-01", price: 4500000, event: "listed" },
    { date: "2026-04-01", price: 4350000, event: "price_drop" },
    { date: "2026-06-01", price: 4200000, event: "verified" },
  ],
  "SA-D008": [
    { date: "2026-05-01", price: 890000, event: "listed" },
    { date: "2026-07-01", price: 870000, event: "price_drop" },
    { date: "2026-07-18", price: 850000, event: "verified" },
  ],
  "SA-D011": [
    { date: "2026-06-01", price: 1500000, event: "listed" },
    { date: "2026-07-15", price: 1450000, event: "price_drop" },
  ],
};

export const DEMO_MARKET_METRICS: MarketMetric[] = [
  { city: "Marrakech", neighborhood: "Guéliz", listingType: "apartment", avgPricePerSqm: 19500, avgRentPerSqm: 850, avgYield: 4.1, sampleSize: 42, updatedAt: "2026-07-01", source: "Samsar IA — agrégat démo", isDemo: true },
  { city: "Marrakech", neighborhood: "Amelkis", listingType: "villa", avgPricePerSqm: 28000, avgRentPerSqm: 620, avgYield: 3.2, sampleSize: 28, updatedAt: "2026-07-01", source: "Samsar IA — agrégat démo", isDemo: true },
  { city: "Rabat", neighborhood: "Hay Riad", listingType: "apartment", avgPricePerSqm: 16800, avgRentPerSqm: 780, avgYield: 4.5, sampleSize: 55, updatedAt: "2026-07-01", source: "Samsar IA — agrégat démo", isDemo: true },
  { city: "Salé", neighborhood: "Technopolis", listingType: "apartment", avgPricePerSqm: 14200, avgRentPerSqm: 920, avgYield: 5.6, sampleSize: 31, updatedAt: "2026-07-01", source: "Samsar IA — agrégat démo", isDemo: true },
  { city: "Casablanca", neighborhood: "Anfa", listingType: "apartment", avgPricePerSqm: 24500, avgRentPerSqm: 950, avgYield: 3.9, sampleSize: 38, updatedAt: "2026-07-01", source: "Samsar IA — agrégat démo", isDemo: true },
  { city: "Bouznika", neighborhood: "Front de mer", listingType: "apartment", avgPricePerSqm: 18500, avgRentPerSqm: 1100, avgYield: 6.8, sampleSize: 18, updatedAt: "2026-07-01", source: "Samsar IA — agrégat démo", isDemo: true },
];

export const DEMO_COMPARABLES: Comparable[] = [
  { id: "comp-001", title: "F3 Guéliz — vente récente (fictif)", city: "Marrakech", neighborhood: "Guéliz", price: 1780000, livingArea: 92, pricePerSqm: 19348, soldAt: "2026-05-12", distanceKm: 0.8, isDemo: true },
  { id: "comp-002", title: "F3 Guéliz — vente récente (fictif)", city: "Marrakech", neighborhood: "Guéliz", price: 1920000, livingArea: 98, pricePerSqm: 19592, soldAt: "2026-04-20", distanceKm: 1.2, isDemo: true },
  { id: "comp-003", title: "F2 Technopolis (fictif)", city: "Salé", neighborhood: "Technopolis", price: 1250000, livingArea: 70, pricePerSqm: 17857, soldAt: "2026-06-08", distanceKm: 0.5, isDemo: true },
  { id: "comp-004", title: "F3 Hay Riad (fictif)", city: "Rabat", neighborhood: "Hay Riad", price: 2100000, livingArea: 125, pricePerSqm: 16800, soldAt: "2026-03-15", distanceKm: 1.0, isDemo: true },
  { id: "comp-005", title: "Studio Bouznika mer (fictif)", city: "Bouznika", neighborhood: "Front de mer", price: 820000, livingArea: 42, pricePerSqm: 19524, soldAt: "2026-07-01", distanceKm: 0.3, isDemo: true },
];

export function getDefaultPriceHistory(reference: string, currentPrice: number): PriceHistoryPoint[] {
  return DEMO_PRICE_HISTORY[reference] ?? [
    { date: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), price: Math.round(currentPrice * 1.03), event: "listed" },
    { date: new Date().toISOString().slice(0, 10), price: currentPrice, event: "verified" },
  ];
}
