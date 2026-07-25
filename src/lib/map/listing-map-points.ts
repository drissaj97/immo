export type CoordinateSource = "exact" | "neighborhood" | "city" | "unknown";

export type MapListingPoint = {
  id: string;
  title: string;
  price: number;
  currency: string;
  slug: string;
  city: string;
  neighborhood: string;
  mapLatitude: number;
  mapLongitude: number;
  coordinateSource: CoordinateSource;
};

export function coordinateSourceLabel(source: CoordinateSource): string {
  switch (source) {
    case "exact":
      return "Position exacte de l'annonce";
    case "neighborhood":
      return "Position approximative — centre du quartier";
    case "city":
      return "Position approximative — centre-ville";
    default:
      return "Localisation indisponible";
  }
}
