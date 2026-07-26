export type SemsaraiProperty = {
  id: string;
  title: string;
  description: string;
  price: number;
  surface?: number;
  bedrooms?: number;
  bathrooms?: number;
  cityName: string;
  quartier?: string;
  country?: string;
  propertyTypeName?: string;
  sell?: boolean;
  longTerm?: boolean;
  images?: string[];
  link?: string;
  site?: string;
  createdAt?: string;
  updatedAt?: string;
  features?: string[];
};

export type SemsaraiPropertiesResponse = {
  properties: SemsaraiProperty[];
  totalCount: number;
  totalPages: number;
};
