/** Recherches préremplies qui marchent hors de la boîte (démo / onboarding). */
export type PopularSearch = {
  label: string;
  region: string;
  city: string;
  neighborhood: string;
  transactionType?: "sale" | "long_term_rent";
};

export const POPULAR_SEARCHES: PopularSearch[] = [
  {
    label: "Victoria · Bouskoura",
    region: "Casablanca-Settat",
    city: "Bouskoura",
    neighborhood: "Victoria",
    transactionType: "sale",
  },
  {
    label: "Maarif · Casablanca",
    region: "Casablanca-Settat",
    city: "Casablanca",
    neighborhood: "Maarif",
    transactionType: "sale",
  },
  {
    label: "Hay Riad · Rabat",
    region: "Rabat-Salé-Kénitra",
    city: "Rabat",
    neighborhood: "Hay Riad",
    transactionType: "sale",
  },
  {
    label: "Sala El Jadida · Salé",
    region: "Rabat-Salé-Kénitra",
    city: "Salé",
    neighborhood: "Sala El Jadida",
    transactionType: "sale",
  },
  {
    label: "Guéliz · Marrakech",
    region: "Marrakech-Safi",
    city: "Marrakech",
    neighborhood: "Guéliz",
    transactionType: "sale",
  },
];

export function popularSearchHref(locale: string, search: PopularSearch, path = "biens"): string {
  const params = new URLSearchParams({
    region: search.region,
    city: search.city,
    neighborhood: search.neighborhood,
    transactionType: search.transactionType ?? "sale",
  });
  return `/${locale}/${path}?${params.toString()}`;
}

/** URL catalogue par défaut (jamais /biens vide). */
export function defaultCatalogHref(locale: string, path = "biens"): string {
  return popularSearchHref(locale, POPULAR_SEARCHES[0], path);
}
