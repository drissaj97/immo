export type NeighborhoodIndex = {
  name: string;
  count: number;
  slug: string;
};

export type CityIndex = {
  name: string;
  slug: string;
  count: number;
  region: string;
  regionSlug: string;
  neighborhoods: NeighborhoodIndex[];
};

export type RegionIndex = {
  name: string;
  slug: string;
  count: number;
  cities: string[];
};

export type MoroccoGeographyIndex = {
  builtAt: string;
  totalListingsScanned: number;
  apiTotalCount: number;
  cities: CityIndex[];
  regions: RegionIndex[];
};
